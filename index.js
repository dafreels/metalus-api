const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('./lib/base.model');
const auth = require('./lib/auth');
const MetalusUtils = require('./lib/metalus-utils');

const options = {
  onconfig: function (config, next) {
    // If this is backed by Mongo, then setup session storage
    if (config.get('storageType') === 'mongodb') {
      const session = require('express-session');
      const MongoDBStore = require('connect-mongodb-session')(session);
      const MongoDb = require('./lib/mongo');
      app.use(session({
        secret: 'metalus',
        cookie: {
          httpOnly: false,
          maxAge: MetalusUtils.MAX_SESSION_AGE
        },
        store: new MongoDBStore({
          uri: MongoDb.buildConnectionUrl(config),
          databaseName: config.get('databaseName'),
          collection: 'authSessions'
        }),
        resave: false,
        saveUninitialized: false
      }));
    }
    BaseModel.initialStorageParameters(config);
    next(null, config);
  }
};

const app = module.exports = express();
app.on('middleware:after:session', (eventargs) => {
  auth.configurePassport(app);
});
app.use(kraken(options));
