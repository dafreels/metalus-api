const LocalStrategy = require('passport-local').Strategy;
const UsersModel = require('../models/users.model');

const auth = {
  '/api/v1/pipelines': {
    auth: true
  },
  '/api/v1/steps': {
    auth: true
  },
  '/api/v1/package-objects': {
    auth: true
  },
  '/api/v1/applications': {
    auth: true
  },
  '/api/v1/users': {
    auth: true,
    exemptRoutes: [
      '/api/v1/users/login'
    ]
  }
};

const blacklist = {
  'developer': {
    '/admin': true
  }
};

exports.localStrategy = () => {
  return new LocalStrategy(async (username, password, done) => {
    const userModel = new UsersModel();
    const user = await userModel.getByKey({ username });
    if (user && user.password === password) {
      user.password = '';
      return done(null, user);
    }
    return done(new Error('Invalid login!'));
  });
};

exports.isAuthenticated = function() {
  return (req, res, next) => {
    const route = req.url;
    const user = req.user;
    const role = (user && user.role) ? user.role : '';

    const permission = Object.entries(auth).find(r => {
      return route.indexOf(r[0]) !== -1
    });
    if (!permission || (permission[1].exemptRoutes && permission[1].exemptRoutes.indexOf(route) !== -1)) {
      next();
    } else if (!req.isAuthenticated()) {
      //If the user is not authorized, save the location that was being accessed so we can redirect afterwards.
      req.session.goingTo = req.url;
      // req.flash('error', 'Please log in to view this page');
      // TODO Figure out how to handle this in angular
      res.sendStatus(401);
      // res.redirect(`${req.protocol}://${req.get('host')}/login`);
    } else if (blacklist[role] && blacklist[role][route] === true) {
      //Check blacklist for this user's role
      // const model = {url: route};

      //pop the user into the response
      res.locals.user = user;
      res.sendStatus(401);
      // TODO Route this to an invalid permissions page
      // res.redirect(`${req.protocol}://${req.get('host')}/login`);
    } else {
      next();
    }
  };
};

exports.injectUser = function() {
  return function injectUser(req, res, next) {
    if (req.isAuthenticated()) {
      res.locals.user = req.user;
    }
    next();
  };
};