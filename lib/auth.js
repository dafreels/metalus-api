const LocalStrategy = require('passport-local').Strategy;
const UsersModel = require('../models/users.model');
const passport = require('passport');
const bcrypt = require('bcrypt');
const MetalusUtils = require('./metalus-utils');
const crypto = require('crypto');

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

const getLocalStrategy = () => {
  return new LocalStrategy(async (username, password, done) => {
    const userModel = new UsersModel();
    const user = await userModel.getByKey({ username });
    if (user && bcrypt.compareSync(password, user.password)) {
      const key = MetalusUtils.createSecretKeyFromString(password);
      let secretKey;
      // If this user does not have a secret key, create one and save it
      if (!user.secretKey) {
        secretKey = MetalusUtils.generateSecretKey();
        user.secretKey = MetalusUtils.encryptString(secretKey, key);
        await userModel.update(user.id, user, null);
      }
      // Decrypt the secret key for the session user
      secretKey = user.secretKey;
      user.secretKey = MetalusUtils.decryptString(secretKey, key);
      return done(null, user);
    }
    return done(new Error('Invalid login!'));
  });
};

exports.localStrategy = getLocalStrategy;

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
      if (req.session && route.indexOf('session-valid') === -1) {
        req.session.cookie.expires = new Date(Date.now() + MetalusUtils.MAX_SESSION_AGE)
        req.session.cookie.maxAge = MetalusUtils.MAX_SESSION_AGE
        req.session.save((err) => {
          if (err) {
            console.log(err);
          }
        });
      }
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

exports.configurePassport = function(app) {
  passport.use('local', getLocalStrategy());
  app.use(passport.initialize());
  app.use(passport.session());
  //Give passport a way to serialize and deserialize a user. In this case, by the user's id.
  passport.serializeUser((user, done) => done(null, { id: user.id, secretKey: user.secretKey }));
  passport.deserializeUser(async (suser, done) => {
    try {
      const user = await new UsersModel().getUser(suser.id);
      if (user) {
        user.secretKey = suser.secretKey;
        return done(null, user);
      }
      return done(new Error('User does not exist!'));
    } catch (err) {
      return done(err);
    }
  });
};
