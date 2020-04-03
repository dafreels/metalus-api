const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('./lib/base.model');
const passport = require('passport');
const auth = require('./lib/auth');
const UserModel = require('./models/users.model');

const options = {
    onconfig: function (config, next) {
        BaseModel.initialStorageParameters(config);
        next(null, config);
    }
};

const app = module.exports = express();
app.on('middleware:after:session', (eventargs) => {
  //Tell passport to use our newly created local strategy for authentication
  passport.use('local', auth.localStrategy());
  app.use(passport.initialize());
  app.use(passport.session());
  //Give passport a way to serialize and deserialize a user. In this case, by the user's id.
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await new UserModel().getUser(id);
      if (user) {
        return done(null, user);
      }
      return done(new Error('User does not exist!'));
    } catch (err) {
      return done(err);
    }
  });
});
app.use(kraken(options));
