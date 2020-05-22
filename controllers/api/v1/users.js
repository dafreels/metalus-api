const UsersModel = require('../../../models/users.model');
const StepsModel = require('../../../models/steps.model');
const PkgObjsModel = require('../../../models/package-objects.model');
const AppsModel = require('../../../models/applications.model');
const PipelinesModel = require('../../../models/pipelines.model');
const passport = require('passport');
const bcrypt = require('bcrypt');
const IncomingForm = require('formidable').IncomingForm;
const ValidationError = require('../../../lib/ValidationError');
const execFile = require('child_process').execFile;
const fs = require('fs');
const util = require('util');
const stat = util.promisify(fs.stat);
const mkdir = util.promisify(fs.mkdir);
const rename = util.promisify(fs.rename);
const readdir = util.promisify(fs.readdir);
const rmdir = util.promisify(fs.rmdir);
const unlink = util.promisify(fs.unlink);
const exec = util.promisify(execFile);

// TODO This should be replaced with the execution library once it is in place
const metalusCommand = `${process.cwd()}/metalus-utils/bin/metadata-extractor.sh`;

module.exports = function (router) {

  router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.redirect(`${req.protocol}://${req.get('host')}/login`);
      }
      req.logIn(user, (error) => {
        if (error) {
          return next(error);
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  router.post('/logout', (req, res) => {
    if (req.logout) {
      req.logout();
    }
    res.sendStatus(204);
  });

  router.get('/', async (req, res, next) => {
    const user = await req.user;
    if (user.role !== 'admin') {
      next(new Error('User does not have permission to see all users!'));
    }
    const userModel = new UsersModel();
    const users = await userModel.getAll();
    if (users && users.length > 0) {
      res.status(200).json({users});
    } else {
      res.sendStatus(204);
    }
  });

  router.post('/', async (req, res, next) => {
    const user = await req.user;
    if (user.role !== 'admin') {
      next(new Error('User does not have permission add a new user!'));
    }
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).send({message: 'POST request missing body'});
    } else {
      const userModel = new UsersModel();
      const newUser = req.body;
      const existingUser = await userModel.getByKey({username: newUser.username});
      if (existingUser) {
        next(new Error('User already exists!'));
      }
      try {
        // hash the password
        newUser.password = bcrypt.hashSync(newUser.password, 8);
        const fullUser = await userModel.createOne(newUser);
        res.status(201).json(fullUser);
      } catch (err) {
        if (err instanceof ValidationError) {
          res.status(422).json({errors: err.getValidationErrors(), body: req.body});
        } else {
          next(err);
        }
      }
    }
  });

  router.put('/:id/changePassword', async (req, res, next) => {
    const changePassword = req.body;
    const userModel = new UsersModel();
    const user = await req.user;
    if (changePassword.id !== user.id && user.role !== 'admin') {
      next(new Error('User does not have permission to change password for different user!'));
    }
    // Verify the provided password matches the password on file
    const updateUser = await userModel.getUser(changePassword.id);
    if (user.role !== 'admin' && !bcrypt.compareSync(changePassword.password, updateUser.password)) {
      next(new Error('Invalid password provided!'));
    }
    // Change password and return new user
    updateUser.password = bcrypt.hashSync(changePassword.newPassword, 8);
    const newuser = await userModel.update(updateUser.id, updateUser);
    res.status(200).json(newuser);
  });

  router.put('/:id', async (req, res, next) => {
    const updateUser = req.body;
    const userModel = new UsersModel();
    const user = await req.user;
    if (updateUser.id !== user.id && user.role !== 'admin') {
      next(new Error('User does not have permission to update this user!'));
    }
    const existingUser = await userModel.getUser(updateUser.id);
    try {
      if (user.role === 'admin' &&
        updateUser.password &&
        updateUser.password.trim().length > 0 &&
        !bcrypt.compareSync(updateUser.password, existingUser.password) &&
        updateUser.password !== existingUser.password) {
        updateUser.password = bcrypt.hashSync(updateUser.password, 8);
      } else {
        // Password cannot be changed using this method
        updateUser.password = existingUser.password;
      }
      const newuser = await userModel.update(updateUser.id, updateUser);
      res.status(200).json(newuser);
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(422).json({errors: err.getValidationErrors(), body: req.body});
      } else {
        next(err);
      }
    }
  });

  router.delete('/:id/project/:projectId', async (req, res, next) => {
    const userModel = new UsersModel();
    const userId = req.params.id;
    const user = await req.user;
    const projectId = req.params.projectId;
    if (userId !== user.id && user.role !== 'admin') {
      next(new Error('User does not have permission to update this user!'));
    }
    const updateUser = await userModel.getUser(userId);
    const index = updateUser.projects.findIndex(p => p.id === projectId);
    updateUser.projects.splice(index, 1);
    const newuser = await userModel.update(updateUser.id, updateUser);
    await deleteProjectData(userId, projectId);
    res.status(200).json(newuser);
  });

  router.delete('/:id', async (req, res, next) => {
    const userModel = new UsersModel();
    const userId = req.params.id;
    const user = await req.user;
    if (userId !== user.id && user.role !== 'admin') {
      next(new Error('User does not have permission to delete this user!'));
    }
    const existingUser = await userModel.getUser(userId);
    for await (const project of existingUser.projects) {
      await deleteProjectData(userId, project.id);
    }
    await userModel.delete(userId);
    res.sendStatus(204);
  });

  router.get('/:id/project/:projectId/files', async (req, res, next) => {
    const user = await req.user;
    const userId = req.params.id;
    const projectId = req.params.projectId;
    if (userId !== user.id) {
      next(new Error('User does not have permission to retrieve files for different user!'));
    }
    const userJarDir = `${process.cwd()}/jars/${userId}/${projectId}`;
    let exists;
    try {
      const stats = await stat(userJarDir);
      exists = stats.isDirectory();
    } catch (err) {
      exists = false;
    }
    const files = exists ? await readdir(userJarDir) : [];
    if (files.length === 0) {
      res.sendStatus(204);
    } else {
      const existingFiles = [];
      let fileStat;
      for await (const file of files) {
        fileStat = await stat(`${userJarDir}/${file}`);
        existingFiles.push({
          name: file,
          path: userJarDir,
          size: fileStat.size,
          createdDate: fileStat.birthtime,
          modifiedDate: fileStat.mtime
        });
      }
      res.status(200).json({files: existingFiles});
    }
  });

  router.post('/:id/project/:projectId/upload', async (req, res, next) => {
    const user = await req.user;
    const userId = req.params.id;
    const projectId = req.params.projectId;
    if (userId !== user.id) {
      next(new Error('User does not have permission to upload files for different user!'));
    }
    const userJarDir = `${process.cwd()}/jars/${userId}/${projectId}`;
    await mkdir(userJarDir, {recursive: true});
    const options = {
      uploadDir: userJarDir
    };
    let uploadedFileName = '';
    const form = new IncomingForm(options);
    form.parse(req)
      .on('file', async (name, file) => {
        uploadedFileName = `${userJarDir}/${file.name}`;
        await rename(file.path, uploadedFileName);
      })
      .once('end', async () => {
        const userModel = new UsersModel();
        const projectUser = await userModel.getUser(userId);
        const project = projectUser.projects.find(p => p.id === projectUser.defaultProjectId);
        if (!project.uploadHistory) {
          project.uploadHistory = [];
        }
        project.uploadHistory.push({
          name: uploadedFileName,
          uploadDate: new Date().getTime()
        });
        await userModel.update(userId, projectUser);
        res.status(200).json({});
      })
      .once('error', (err) => {
        next(err);
      });
  });

  router.delete('/:id/project/:projectId/files/:fileName', async (req, res, next) => {
    const user = await req.user;
    const userId = req.params.id;
    const projectId = req.params.projectId;
    const fileName = req.params.fileName;
    if (userId !== user.id) {
      next(new Error('User does not have permission to delete files for different user!'));
    }
    const filePath = `${process.cwd()}/jars/${userId}/${projectId}/${fileName}`;
    let exists;
    try {
      const stats = await stat(filePath);
      exists = stats.isFile();
    } catch (err) {
      exists = false;
    }
    if (exists) {
      await unlink(filePath);
    }
    res.sendStatus(204);
  });

  router.put('/:id/project/:projectId/processUploadedJars', async (req, res, next) => {
    const user = await req.user;
    const userId = req.params.id;
    const projectId = req.params.projectId;
    const password = req.body.password;
    const repos = req.body.repos;
    const remoteJars = req.body.remoteJars;
    if (userId !== user.id) {
      next(new Error('User does not have permission to process files for different user!'));
    }
    const userModel = new UsersModel();
    const projectUser = await userModel.getUser(userId);
    if (!bcrypt.compareSync(password, projectUser.password)) {
      next(new Error('Unable to upload metadata: Invalid password!'));
    }
    const userJarDir = `${process.cwd()}/jars/${userId}/${projectId}`;
    const stagingDir = `${userJarDir}/staging`;
    const jarFiles = [];
    try {
      const stats = await stat(userJarDir);
      if (stats.isDirectory()) {
        const files = await readdir(userJarDir);
        if (files.length > 0) {
          files.forEach((f) => {
            if (f.indexOf('.jar') >= 1) {
              jarFiles.push(`${userJarDir}/${f}`);
            }
          });
        }
      }
    } catch (err) {}
    if (remoteJars && remoteJars.trim().length > 0) {
      remoteJars.split(",").forEach(f => jarFiles.push(f));
    }
    if (jarFiles.length > 0) {
      const parameters = [
        '--api-url',
        `http://localhost:${req.socket.localPort}`,
        '--no-auth-download',
        'true',
        '--staging-dir',
        stagingDir,
        '--jar-files',
        jarFiles.join(','),
        '--authorization.class',
        'com.acxiom.pipeline.api.SessionAuthorization',
        '--authorization.username',
        projectUser.username,
        '--authorization.password',
        password,
        '--authorization.authUrl',
        `http://localhost:${req.socket.localPort}/api/v1/users/login`,
        '--clean-staging',
        'true'
      ];
      if (repos && repos.trim().length > 0) {
        parameters.push('--repo');
        parameters.push(repos);
      }
      try {
        await exec(metalusCommand, parameters, { maxBuffer: 1024 * 5000 });
        // Delete the jar directory
        await removeDir(stagingDir);
        await removeDir(userJarDir);
      } catch (err) {
        //TODO clean this up
        return res.status(400).json({error: err});
      }
    }
    res.status(204).json({});
  });
};

async function removeDir(dir) {
  // Remove any additional files
  let exists;
  try {
    const stats = await stat(dir);
    exists = stats.isDirectory();
  } catch (err) {
    exists = false;
  }
  if (exists) {
    const stagedFiles = await readdir(dir) || [];
    if (stagedFiles.length > 0) {
      for await (const file of stagedFiles) {
        await unlink(`${dir}/${file}`);
      }
    }
    // Delete the directory
    await rmdir(dir);
  }
}

async function deleteProjectData(userId, projectId) {
  const query = {
    project: {
      userId,
      projectId
    }
  };
  const userJarDir = `${process.cwd()}/jars/${userId}/${projectId}`;
  await removeDir(`${userJarDir}/staging`);
  await removeDir(userJarDir);
  await new StepsModel().deleteMany(query);
  await new AppsModel().deleteMany(query);
  await new PkgObjsModel().deleteMany(query);
  return await new PipelinesModel().deleteMany(query);
}
