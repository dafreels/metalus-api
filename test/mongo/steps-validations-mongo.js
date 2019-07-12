const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const stepData = require('../data/steps');
const MongoDb = require('../../lib/mongo');

describe('Steps Validation Mongo Tests', () => {
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
        config.set('storageType', 'mongodb');
        config.set('databaseName', 'testDataStepsValidations');
        BaseModel.initialStorageParameters(config);
        MongoDb.init(config)
          .then(() => {
            next(null, config);
          })
          .catch(next);
      }
    }));
    mock = server.listen(1309);
  });

  after((done) => {
    app.removeListener('start', done);
    MongoDb.getDatabase().dropDatabase();
    MongoDb.disconnect();
    mock.close(done);
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
      .expect(422);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('errors').lengthOf(2);
    expect(stepResponse).to.have.property('body');
    const errors = stepResponse.errors;
    expect(errors.find(err => err.params.missingProperty === 'displayName')).to.exist
    expect(errors.find(err => err.params.missingProperty === 'type')).to.exist
    await request(mock).get('/api/v1/steps').expect(204);
  });

  it('Should fail insert on bad type', async () => {
    badBody.displayName = 'Something to pass validation';
    badBody.type = 'action';
    const response = await request(mock)
      .post('/api/v1/steps/')
      .send(badBody)
      .expect('Content-Type', /json/)
      .expect(422);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('errors').lengthOf(1);
    expect(stepResponse).to.have.property('body');
    const errors = stepResponse.errors;
    expect(errors.find(err => err.dataPath === '.type')).to.exist
    await request(mock).get('/api/v1/steps').expect(204);
  });

  it('Should fail delete when missing record', async () => {
    const response = await request(mock).delete('/api/v1/steps/bad-id')
      .expect('Content-Type', /json/)
      .expect(500);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('errors').eq('no records found for id bad-id');
  });

  it('Should fail update when missing record', async () => {
    const response = await request(mock)
      .put('/api/v1/steps/bad-id')
      .send(stepData.find(step => step.id === '0a296858-e8b7-43dd-9f55-88d00a7cd8fa'))
      .expect('Content-Type', /json/)
      .expect(500);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('errors').eq('update failed: id from object(0a296858-e8b7-43dd-9f55-88d00a7cd8fa) does not match id from url(bad-id)');
  });
});
