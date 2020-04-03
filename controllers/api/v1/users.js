// const UsersModel = require('../../../models/users.model');
// const BaseRoutes = require('../../../lib/base.routes');
const passport = require('passport');

module.exports = function (router) {
  // const baseRoutes = new BaseRoutes('user', 'users', UsersModel);
  // baseRoutes.buildBasicCrudRoutes(router);

  // custom routes go here
  router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.redirect(`${req.protocol}://${req.get('host')}/login`);
      }
      // res.json(user);
      req.logIn(user, (error) => {
        if (error) {
          return next(error);
        }
        return res.json(user);
      });
    })(req, res, next);
  });
};
