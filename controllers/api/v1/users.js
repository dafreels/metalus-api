const UsersModel = require('../../../models/users.model');
const StepsModel = require('../../../models/steps.model');
const PkgObjsModel = require('../../../models/package-objects.model');
const ProvidersModel = require('../../../models/providers.model');
const JobsModel = require('../../../models/jobs.model');
const AppsModel = require('../../../models/applications.model');
const ExecutionsModel = require('../../../models/executions.model');
const PipelinesModel = require('../../../models/pipelines.model');
const passport = require('passport');
const bcrypt = require('bcrypt');
const IncomingForm = require('formidable').IncomingForm;
const ValidationError = require('../../../lib/ValidationError');
const MetalusUtils = require('../../../lib/metalus-utils');
const fs = require('fs');

const metalusCommand = `${process.cwd()}/metalus-utils/bin/metadata-extractor.sh`;

module.exports = function (router) {
  router.post('/login', login);
  router.post('/logout', logout);
  router.get('/:id/session-valid', checkValidSession);
  router.get('/', listUsers);
  router.post('/', createUser);
  router.put('/:id/changePassword', changePassword);
  router.put('/:id', updateUser);
  router.delete('/:id', deleteUser);
  router.delete('/:id/project/:projectId', deleteProject);
  router.get('/:id/project/:projectId/files', listUploadedFiles);
  router.post('/:id/project/:projectId/upload', uploadJar);
  router.delete('/:id/project/:projectId/files/:fileName', deleteUploadedJar);
  router.get('/:id/project/:projectId/process-status', checkProcessingStatus);
  router.put('/:id/project/:projectId/processUploadedJars', processUploadedJars);
  router.put('/:id/project/:projectId/export-metadata', exportMetadata);
  router.get('/:id/usage-report', getUsageReport);
};

function login(req, res, next) {
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
      // Make sure to remove the secret key before ending it back.
      const loginUser = MetalusUtils.clone(user);
      delete loginUser.secretKey;
      return res.json(loginUser);
    });
  })(req, res, next);
}

function logout(req, res) {
  if (req.logout) {
    req.logout();
    req.session.destroy((err) => {
      res.sendStatus(204);
    });
  } else {
    res.sendStatus(204);
  }
}

async function checkValidSession(req, res) {
  const user = await req.user;
  if (user && user.id === req.params.id) {
    res.status(200).json({
      expires: req.session.cookie._expires.getTime()
    });
  } else {
    res.status(401).json({});
  }
}

async function listUsers(req, res, next) {
  const user = await req.user;
  if (user.role !== 'admin') {
    next(new Error('User does not have permission to see all users!'));
  }
  const userModel = new UsersModel();
  const users = await userModel.getAll();
  if (users && users.length > 0) {
    res.status(200).json({users: users.map(u => {
        delete u.secretKey;
        return u;
      })});
  } else {
    res.sendStatus(204);
  }
}

async function createUser(req, res, next) {
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
      // Create an encryption key
      const key = MetalusUtils.generateSecretKey();
      newUser.secretKey = MetalusUtils.encryptString(key, MetalusUtils.createSecretKeyFromString(newUser.password));
      // hash the password
      newUser.password = bcrypt.hashSync(newUser.password, 8);
      const fullUser = await userModel.createOne(newUser);
      delete fullUser.secretKey;
      res.status(201).json(fullUser);
    } catch (err) {
      if (err instanceof ValidationError) {
        res.status(422).json({errors: err.getValidationErrors(), body: req.body});
      } else {
        next(err);
      }
    }
  }
}

async function changePassword(req, res, next) {
  const changePassword = req.body;
  const userModel = new UsersModel();
  const user = await req.user;
  if (changePassword.id !== user.id) {
    next(new Error('User does not have permission to change password for different user!'));
  }
  // Verify the provided password matches the password on file
  const updateUser = await userModel.getUser(changePassword.id);
  if (!bcrypt.compareSync(changePassword.password, updateUser.password)) {
    next(new Error('Invalid password provided!'));
  }
  // Change password and return new user
  updateUser.password = bcrypt.hashSync(changePassword.newPassword, 8);
  // Re-encrypt the secretKey
  const secretKey = MetalusUtils.decryptString(updateUser.secretKey, MetalusUtils.createSecretKeyFromString(changePassword.password));
  updateUser.secretKey = MetalusUtils.encryptString(secretKey, MetalusUtils.createSecretKeyFromString(changePassword.newPassword));
  const newuser = await userModel.update(updateUser.id, updateUser);
  delete newuser.secretKey;
  res.status(200).json(newuser);
}

async function updateUser(req, res, next) {
  const updateUser = req.body;
  const userModel = new UsersModel();
  const user = await req.user;
  if (updateUser.id !== user.id && user.role !== 'admin') {
    next(new Error('User does not have permission to update this user!'));
  }
  const existingUser = await userModel.getUser(updateUser.id);
  try {
    // Password cannot be changed using this method
    updateUser.password = existingUser.password;

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
        const steps = JSON.parse(await MetalusUtils.readfile(`${templatesDir}/${template}/steps.json`));
        const pipelines = JSON.parse(await MetalusUtils.readfile(`${templatesDir}/${template}/pipelines.json`));
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
    delete newuser.secretKey;
    res.status(200).json(newuser);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(422).json({errors: err.getValidationErrors(), body: req.body});
    } else {
      next(err);
    }
  }
}

async function deleteUser(req, res, next) {
  const userModel = new UsersModel();
  const userId = req.params.id;
  const user = await req.user;
  if (userId !== user.id && user.role !== 'admin') {
    next(new Error('User does not have permission to delete this user!'));
  }
  const existingUser = await userModel.getUser(userId);
  for await (const project of existingUser.projects) {
    await deleteProjectData(userId, project.id, `${MetalusUtils.getProjectJarsBaseDir(req)}/${userId}`);
  }
  await userModel.delete(userId);
  res.sendStatus(204);
}

async function getUsageReport(req, res, next) {
  const userId = req.params.id;
  const user = await req.user;
  if (userId !== user.id && user.role !== 'admin') {
    next(new Error('User does not have permission to retrieve usage report!'));
  }
  const query = {
    project: {
      userId,
      projectId: user.defaultProjectId,
    }
  };
  try {
    const report = {
      stepsCount: await new StepsModel().getCount(query),
      applicationsCount: await new AppsModel().getCount(query),
      pipelinesCount: await new PipelinesModel().getCount(query),
      packageObjectsCount: await new PkgObjsModel().getCount(query),
      executionTemplatesCount: await new ExecutionsModel().getCount(query),
    };
    query.project.projectId = null;
    report.jobsCount = await new JobsModel().getCount(query);
    report.providersCount = await new ProvidersModel().getCount(query);
    res.status(200).json({report});
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
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
  await deleteProjectData(userId, projectId, `${MetalusUtils.getProjectJarsBaseDir(req)}/${userId}/${projectId}`);
  delete newuser.secretKey;
  res.status(200).json(newuser);
}

async function listUploadedFiles(req, res, next) {
  const user = await req.user;
  const userId = req.params.id;
  const projectId = req.params.projectId;
  if (userId !== user.id) {
    next(new Error('User does not have permission to retrieve files for different user!'));
  }
  const userJarDir = `${MetalusUtils.getProjectJarsBaseDir(req)}/${userId}/${projectId}`;
  let exists;
  try {
    const stats = await MetalusUtils.stat(userJarDir);
    exists = stats.isDirectory();
  } catch (err) {
    exists = false;
  }
  const files = exists ? await MetalusUtils.readdir(userJarDir) : [];
  if (files.length === 0) {
    res.sendStatus(204);
  } else {
    const existingFiles = [];
    let fileStat;
    for await (const file of files) {
      fileStat = await MetalusUtils.stat(`${userJarDir}/${file}`);
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
}

async function uploadJar(req, res, next) {
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
    const userJarDir = `${MetalusUtils.getProjectJarsBaseDir(req)}/${userId}/${projectId}`;
    await MetalusUtils.mkdir(userJarDir, {recursive: true});
    const options = {
      uploadDir: userJarDir
    };
    let uploadedFileName = '';
    const form = new IncomingForm(options);
    form.parse(req)
      .on('file', async (name, file) => {
        uploadedFileName = `${userJarDir}/${file.name}`;
        await MetalusUtils.rename(file.path, uploadedFileName);
      })
      .once('end', async () => {
        const userModel = new UsersModel();
        const projectUser = await userModel.getUser(userId);
        await userModel.update(userId, projectUser);
        res.status(200).json({});
      })
      .once('error', (err) => {
        next(err);
      });
  }
}

async function deleteUploadedJar(req, res, next) {
  const user = await req.user;
  const userId = req.params.id;
  const projectId = req.params.projectId;
  const fileName = req.params.fileName;
  if (userId !== user.id) {
    next(new Error('User does not have permission to delete files for different user!'));
  } else {
    const filePath = `${MetalusUtils.getProjectJarsBaseDir(req)}/${userId}/${projectId}/${fileName}`;
    let exists;
    try {
      const stats = await MetalusUtils.stat(filePath);
      exists = stats.isFile() || stats.isDirectory();
    } catch (err) {
      exists = false;
    }
    if (exists) {
      await MetalusUtils.removeDir(filePath);
      res.status(200).json({'status': 'success'});
    } else {
      res.status(204).json({'status': 'file not found'});
    }
  }
}

async function checkProcessingStatus(req, res) {
  const user = await req.user;
  const userId = req.params.id;
  const projectId = req.params.projectId;
  if (userId !== user.id) {
    next(new Error('User does not have permission to process files for different user!'));
    return;
  }
  const userJarDir = `${MetalusUtils.getProjectJarsBaseDir(req)}/${userId}/${projectId}`;
  try {
    const json = await MetalusUtils.readfile(`${userJarDir}/processedJars.json`);
    res.status(200).json(JSON.parse(json.toString()));
  } catch (err) {
    res.status(200).json({
      status: 'waiting',
    });
  }
}

async function processUploadedJars(req, res, next) {
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
    return;
  }
  const userModel = new UsersModel();
  const projectUser = await userModel.getUser(userId);
  if (!bcrypt.compareSync(password, projectUser.password)) {
    next(new Error('Unable to upload metadata: Invalid password!'));
    return;
  }
  const processJSON = {};
  const userJarDir = `${MetalusUtils.getProjectJarsBaseDir(req)}/${userId}/${projectId}`;
  const stagingDir = `${userJarDir}/staging`;
  const jarFiles = [];
  try {
    const stats = await MetalusUtils.stat(userJarDir);
    if (stats.isDirectory()) {
      const files = await MetalusUtils.readdir(userJarDir);
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
    processJSON.remoteJars = remoteJars.split(',');
    processJSON.remoteJars.forEach(f => jarFiles.push(f));
  }
  if (jarFiles.length > 0) {
    processJSON.jarFiles = jarFiles;
    const parameters = [
      '--api-url',
      `http://localhost:${req.socket.localPort}`,
      '--authorization.class',
      'com.acxiom.pipeline.api.SessionAuthorization',
      '--authorization.username',
      projectUser.username,
      '--authorization.password',
      password,
      '--authorization.authUrl',
      `http://localhost:${req.socket.localPort}/api/v1/users/login`,
      '--staging-dir',
      stagingDir,
      '--jar-files',
      jarFiles.join(','),
      '--no-auth-download',
      'true',
      '--clean-staging',
      'true'
    ];
    if (repos && repos.trim().length > 0) {
      parameters.push('--repo');
      parameters.push(`${userJarDir},${repos}`);
      processJSON.repos = repos;
    } else {
      parameters.push('--repo');
      parameters.push(userJarDir);
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
      processJSON.status = 'processing';
      // Write the process file
      await MetalusUtils.writefile(`${userJarDir}/processedJars.json`, JSON.stringify(processJSON));
      res.status(200).json(processJSON);
    } catch (err) {
      res.status(400).json({error: err});
      return;
    }
    try {
      await MetalusUtils.exec(metalusCommand, parameters, {maxBuffer: 1024 * 10000});
      processJSON.status = 'complete';
      await MetalusUtils.writefile(`${userJarDir}/processedJars.json`, JSON.stringify(processJSON));
    } catch (err) {
      MetalusUtils.log(`Error processing jars: ${err}`);
      processJSON.status = 'failed';
      processJSON.error = `Error processing jars: ${err}`;
      await MetalusUtils.writefile(`${userJarDir}/processedJars.json`, JSON.stringify(processJSON));
      return;
    }
    try {
      // Delete the jar directory
      await MetalusUtils.removeDir(stagingDir);
      // await MetalusUtils.removeDir(userJarDir);
    } catch (err) {
      MetalusUtils.log(`Error removing staging dir: ${err}`);
    }
  } else {
    // MetalusUtils.log('Process Jars Complete');
    res.sendStatus(204);
  }
}

async function exportMetadata(req, res, next) {
  const user = await req.user;
  const userId = req.params.id;
  if (userId !== user.id) {
    next(new Error('User does not have permission to export metadata for different user!'));
  }

  const projectId = req.params.projectId;
  const jarName = req.body.name;
  const recursive = req.body.recursive;
  const applicationIds = req.body.applicationIds;
  const executionIds = req.body.executionIds;
  const pipelineIds = req.body.pipelineIds || [];
  const stepFormIds = req.body.stepFormIds || [];
  const classFormIds = req.body.classFormIds || [];

  const userKey = {
    id: user.id,
    projectId,
  };

  const downloadsBaseDir = `${MetalusUtils.getProjectJarsBaseDir(req)}/downloads/${userId}/${projectId}`;
  const tempDir = `${downloadsBaseDir}/tmp/${jarName}/metadata`;
  await MetalusUtils.mkdir(tempDir, {recursive: true});
  const applicationsModel = new AppsModel();
  const storedApps = await applicationsModel.getAll(userKey);
  await MetalusUtils.mkdir(`${tempDir}/applications`, {recursive: true});
  for await (let application of storedApps.filter(a => applicationIds.indexOf(a.id) !== -1)) {
    await MetalusUtils.writefile(`${tempDir}/applications/${application.id}.json`, Buffer.from(JSON.stringify(application)));
    application.executions.forEach((exe) => {
      delete exe.pipelines;
      if (recursive && exe.executionId && executionIds.indexOf(exe.executionId) === -1) {
        executionIds.push(exe.executionId);
      }
      if (recursive && exe.pipelineIds) {
        exe.pipelineIds.forEach((id) => {
          if (executionIds.indexOf(id) === -1) {
            executionIds.push(id);
          }
        });
      }
    });
  }
  const executionsModel = new ExecutionsModel();
  await MetalusUtils.mkdir(`${tempDir}/executions`, {recursive: true});
  let execution;
  for await (let executionId of executionIds) {
    execution = await executionsModel.getByKey({ id: executionId }, userKey)
    await MetalusUtils.writefile(`${tempDir}/executions/${executionId}.json`, Buffer.from(JSON.stringify(execution)));
  }
  let pipeline;
  const pipelinesModel = new PipelinesModel();
  await MetalusUtils.mkdir(`${tempDir}/pipelines`, {recursive: true});
  for await (let pipelineId of pipelineIds) {
    pipeline = await pipelinesModel.getByKey({ id: pipelineId }, userKey);
    delete pipeline.tags;
    const steps = [];
    pipeline.steps.forEach((step) => {
      delete step.tags;
      steps.push(step);
      if (recursive) {
        if (stepFormIds.indexOf(step.stepId) === -1) {
          stepFormIds.push(step.stepId);
        }
      }
    });
    pipeline.steps = steps;
    await MetalusUtils.writefile(`${tempDir}/pipelines/${pipelineId}.json`, Buffer.from(JSON.stringify(pipeline)));
  }
  let stepTemplate;
  let stepForm;
  const stepsModel = new StepsModel();
  await MetalusUtils.mkdir(`${tempDir}/stepForms`, {recursive: true});
  for await (let stepId of stepFormIds) {
    stepForm = await stepsModel.getTemplate(stepId, userKey);
    await MetalusUtils.writefile(`${tempDir}/stepForms/${stepId}.json`, Buffer.from(JSON.stringify(stepForm)));
    // Get the class info
    if (recursive) {
      stepTemplate = await stepsModel.getByKey({ id: stepId }, userKey);
      stepTemplate.params.forEach((param) => {
        if (param.className && param.className.trim().length > 0 && classFormIds.indexOf(param.className.trim()) === -1) {
          classFormIds.push(param.className.trim());
        }
      });
    }
  }
  let pkgObj;
  const pkgObjModel = new PkgObjsModel();
  await MetalusUtils.mkdir(`${tempDir}/packageForms`, {recursive: true});
  for await (let pkgId of classFormIds) {
    pkgObj = await pkgObjModel.getByKey({ id: pkgId }, userKey);
    await MetalusUtils.writefile(`${tempDir}/packageForms/${pkgId.replace(/\\./g, '_')}.json`, Buffer.from(pkgObj.template));
  }

  // Create jar
  const cwd = process.cwd();
  process.chdir(`${downloadsBaseDir}/tmp/${jarName}`);
  await MetalusUtils.exec(process.env.JAR_COMMAND || 'jar', ['cf', `${jarName}.jar`, 'metadata']);
  process.chdir(cwd);
  // Push jar to client
  await MetalusUtils.pipeline(
    fs.createReadStream(`${downloadsBaseDir}/tmp/${jarName}.jar`),
    res,
  );
  // Cleanup the temp directory
  await MetalusUtils.removeDir(`${downloadsBaseDir}/tmp`);
}

async function deleteProjectData(userId, projectId, userJarDir) {
  const query = {
    project: {
      userId,
      projectId
    }
  };
  await MetalusUtils.removeDir(`${userJarDir}/staging`);
  await MetalusUtils.removeDir(userJarDir);
  await new StepsModel().deleteMany(query);
  await new StepsModel().deleteTemplates(query);
  await new AppsModel().deleteMany(query);
  await new PkgObjsModel().deleteMany(query);
  await new PipelinesModel().deleteMany(query);
  await new ExecutionsModel().deleteMany(query);
  delete query.project.projectId;
  await new JobsModel().deleteMany(query);
  return await new ProvidersModel().deleteMany(query);
}

function getTemplatesDir(req) {
  return req.app.kraken.get('baseTemplatesDir') || `${process.cwd()}/templates`;
}
