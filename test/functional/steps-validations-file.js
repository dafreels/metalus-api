const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const rmdir = require('rimraf');
const stepData = require('../data/steps');

describe('Steps Validation File Tests', () => {
  let dataDir;
  let app;
  let server;
  let mock;
  const badBody = stepData.find(step => step.id === 'bad_step_data');

  before((done) => {
    app = express();
    server = http.createServer(app);
    app.on('start', () => {
      done();
    });
    app.use(kraken({
      basedir: process.cwd(),
      onconfig: (config, next) => {
        config.set('dataDir', 'testDataValidationStepTests');
        dataDir = `./${config.get('dataDir') || 'data'}`;
        BaseModel.initialStorageParameters(config);
        next(null, config);
      }
    }));
    mock = server.listen(1301);
  });

  after((done) => {
    rmdir(dataDir, () => {
      app.removeListener('start', done);
      mock.close(done);
    });
  });

  it('Should fail insert on missing body', async () => {
    const response = await request(mock)
      .post('/api/v1/steps/')
      .expect('Content-Type', /json/)
      .expect(400);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('message').eq('POST request missing body');
    await request(mock).get('/api/v1/steps').expect(204);
  });

  it('Should fail validation on insert', async () => {
    const response = await request(mock)
      .post('/api/v1/steps/')
      .send(badBody)
      .expect('Content-Type', /json/)
      .expect(500);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('errors').lengthOf(2);
    expect(stepResponse).to.have.property('body');
    const errors = stepResponse.errors;
    expect(errors.find(err => err.params.missingProperty === 'displayName')).to.exist
    expect(errors.find(err => err.params.missingProperty === 'type')).to.exist
    await request(mock).get('/api/v1/steps').expect(204);
  });
});
