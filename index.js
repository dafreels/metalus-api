const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('./lib/base.model');
const auth = require('./lib/auth');

const options = {
    onconfig: function (config, next) {
        BaseModel.initialStorageParameters(config);
        next(null, config);
    }
};

const app = module.exports = express();
app.on('middleware:after:session', (eventargs) => {
  auth.configurePassport(app);
});
app.use(kraken(options));
