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
app.on('start', function () {
    console.log('Application ready to serve requests.');
    console.log('Environment: %s', app.kraken.get('env:env'));
});
