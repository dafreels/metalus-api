const UsersModel = require('../../../models/users.model');
const StepsModel = require('../../../models/steps.model');
const PkgObjsModel = require('../../../models/package-objects.model');
const AppsModel = require('../../../models/applications.model');
const PipelinesModel = require('../../../models/pipelines.model');
const passport = require('passport');
const bcrypt = require('bcrypt');

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

  router.get('/', async (req, res, next) => {
    const user = await req.user;
    if (user.role !== 'admin') {
      next(new Error('User does not have permission to see all users!'));
    }
    const userModel = new UsersModel();
    const users = await userModel.getAll();
    if (users && users.length > 0) {
      res.status(200).json({ users });
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
        newUser.password = bcrypt.hashSync(user.password, 8);
        const fullUser = await userModel.createOne(newUser);
        res.status(201).json(fullUser);
      } catch(err) {
        res.status(422).json({errors: err.getValidationErrors(), body: req.body});
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
      // Password cannot be changed using this method
      updateUser.password = existingUser.password;
      const newuser = await userModel.update(updateUser.id, updateUser);
      res.status(200).json(newuser);
    } catch (err) {
      res.status(422).json({errors: err.getValidationErrors(), body: req.body});
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
};

async function deleteProjectData(userId, projectId) {
  const query = {
    project: {
      userId,
      projectId
    }
  };
  await new StepsModel().deleteMany(query);
  await new AppsModel().deleteMany(query);
  await new PkgObjsModel().deleteMany(query);
  return await new PipelinesModel().deleteMany(query);
}
