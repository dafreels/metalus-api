const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('./lib/base.model');

const options = {
    onconfig: function (config, next) {
        BaseModel.initialStorageParameters(config);
        next(null, config);
    }
};

const app = module.exports = express();
app.use(kraken(options));
