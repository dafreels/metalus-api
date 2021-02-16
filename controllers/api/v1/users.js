const UsersModel = require('../../../models/users.model');
const StepsModel = require('../../../models/steps.model');
const PkgObjsModel = require('../../../models/package-objects.model');
const AppsModel = require('../../../models/applications.model');
const PipelinesModel = require('../../../models/pipelines.model');
const passport = require('passport');
const bcrypt = require('bcrypt');
const IncomingForm = require('formidable').IncomingForm;
const ValidationError = require('../../../lib/ValidationError');
const mUtils = require('../../../lib/metalus-utils');


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
      req.session.destroy((err) => {
        res.sendStatus(204);
      });
    } else {
      res.sendStatus(204);
    }
  });

  router.get('/:id/session-valid', async (req, res) => {
    const user = await req.user;
    if (user && user.id === req.params.id) {
      res.status(200).json({
        expires: req.session.cookie._expires.getTime()
      });
    } else {
      res.status(401).json({});
    }
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

      let metaDataUpload = updateUser.metaDataLoad;
      delete updateUser.metaDataLoad;
      // Determine if any templates were selected and load the data
      if (metaDataUpload) {
        const templatesDir = getTemplatesDir(req);
        const metadataUser = {
          id: updateUser.id,
          defaultProjectId: metaDataUpload.projectId,
        };
        for await (const template of metaDataUpload.selectedTemplates) {
          const steps = JSON.parse(await mUtils.readfile(`${templatesDir}/${template}/steps.json`));
          const pipelines = JSON.parse(await mUtils.readfile(`${templatesDir}/${template}/pipelines.json`));
          if (steps.steps && steps.steps.length > 0) {
            const stepsModel = new StepsModel();
            await stepsModel.createMany(steps.steps, metadataUser);
          }
          if (steps.pkgObjs && steps.pkgObjs.length > 0) {
            const pkgObjsModel = new PkgObjsModel();
            await pkgObjsModel.createMany(steps.pkgObjs, metadataUser);
          }
          if (pipelines && pipelines.length > 0) {
            const pipelinesModel = new PipelinesModel();
            await pipelinesModel.createMany(pipelines, metadataUser);
          }
        }
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
    await deleteProjectData(userId, projectId, `${getProjectJarsBaseDir(req)}/${userId}/${projectId}`);
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
      await deleteProjectData(userId, project.id, `${getProjectJarsBaseDir(req)}/${userId}`);
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
    const userJarDir = `${getProjectJarsBaseDir(req)}/${userId}/${projectId}`;
    let exists;
    try {
      const stats = await mUtils.stat(userJarDir);
      exists = stats.isDirectory();
    } catch (err) {
      exists = false;
    }
    const files = exists ? await mUtils.readdir(userJarDir) : [];
    if (files.length === 0) {
      res.sendStatus(204);
    } else {
      const existingFiles = [];
      let fileStat;
      for await (const file of files) {
        fileStat = await mUtils.stat(`${userJarDir}/${file}`);
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
    let errors = false;
    if (userId !== user.id) {
      errors = true;
      next(new Error('User does not have permission to upload files for different user!'));
    }

    const projectExists = await new UsersModel().hasProjectId(userId, projectId);
    if(!projectExists) {
      errors = true;
      next(new Error(`User has not setup a project with id ${projectId}`));
    }

    if(!errors) {
      const userJarDir = `${getProjectJarsBaseDir(req)}/${userId}/${projectId}`;
      await mUtils.mkdir(userJarDir, {recursive: true});
      const options = {
        uploadDir: userJarDir
      };
      let uploadedFileName = '';
      const form = new IncomingForm(options);
      form.parse(req)
        .on('file', async (name, file) => {
          uploadedFileName = `${userJarDir}/${file.name}`;
          await mUtils.rename(file.path, uploadedFileName);
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
    }
  });

  router.delete('/:id/project/:projectId/files/:fileName', async (req, res, next) => {
    const user = await req.user;
    const userId = req.params.id;
    const projectId = req.params.projectId;
    const fileName = req.params.fileName;
    if (userId !== user.id) {
      next(new Error('User does not have permission to delete files for different user!'));
    } else {
      const filePath = `${getProjectJarsBaseDir(req)}/${userId}/${projectId}/${fileName}`;
      let exists;
      try {
        const stats = await mUtils.stat(filePath);
        exists = stats.isFile() || stats.isDirectory();
      } catch (err) {
        exists = false;
      }
      if (exists) {
        await mUtils.removeDir(filePath);
        res.status(200).json({'status': 'success'});
      } else {
        res.status(204).json({'status': 'file not found'});
      }
    }
  });

  router.put('/:id/project/:projectId/processUploadedJars', async (req, res, next) => {
    const user = await req.user;
    const userId = req.params.id;
    const projectId = req.params.projectId;
    const password = req.body.password;
    const repos = req.body.repos;
    const remoteJars = req.body.remoteJars;
    const skipPipelines = req.body.skipPipelines;
    const skipSteps = req.body.skipSteps;
    if (userId !== user.id) {
      next(new Error('User does not have permission to process files for different user!'));
    }
    const userModel = new UsersModel();
    const projectUser = await userModel.getUser(userId);
    if (!bcrypt.compareSync(password, projectUser.password)) {
      next(new Error('Unable to upload metadata: Invalid password!'));
    }
    const userJarDir = `${getProjectJarsBaseDir(req)}/${userId}/${projectId}`;
    const stagingDir = `${userJarDir}/staging`;
    const jarFiles = [];
    try {
      const stats = await mUtils.stat(userJarDir);
      if (stats.isDirectory()) {
        const files = await mUtils.readdir(userJarDir);
        if (files.length > 0) {
          files.forEach((f) => {
            if (f.indexOf('.jar') >= 1) {
              jarFiles.push(`${userJarDir}/${f}`);
            }
          });
        }
      }
    } catch (err) {
      // Do nothing since it is a valid state to not have a project directory when uploading remote jars
    }
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
      if (skipPipelines) {
        parameters.push('--excludePipelines');
        parameters.push('true');
      }

      if (skipSteps) {
        parameters.push('--excludeSteps');
        parameters.push('true');
      }
      try {
        await mUtils.exec(metalusCommand, parameters, {maxBuffer: 1024 * 5000});
        // Delete the jar directory
        await mUtils.removeDir(stagingDir);
        await mUtils.removeDir(userJarDir);
      } catch (err) {
        //TODO clean this up
        return res.status(400).json({error: err});
      }
    }
    res.status(204).json({});
  });
};

async function deleteProjectData(userId, projectId, userJarDir) {
  const query = {
    project: {
      userId,
      projectId
    }
  };
  await mUtils.removeDir(`${userJarDir}/staging`);
  await mUtils.removeDir(userJarDir);
  await new StepsModel().deleteMany(query);
  await new AppsModel().deleteMany(query);
  await new PkgObjsModel().deleteMany(query);
  return await new PipelinesModel().deleteMany(query);
}

function getProjectJarsBaseDir(req) {
  return req.app.kraken.get('baseJarsDir') || `${process.cwd()}/jars`;
}

function getTemplatesDir(req) {
  return req.app.kraken.get('baseTemplatesDir') || `${process.cwd()}/templates`;
}
