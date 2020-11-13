const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const rmdir = require('rimraf-promise');
const stepData = require('../data/steps');
const util = require('util');
const fs = require('fs');
const auth = require('../../lib/auth');
const TestHelpers = require('../helpers/TestHelpers');

describe('Steps Validation File Tests', () => {
  let dataDir;
  let app;
  let server;
  let mock;
  const state = {};
  const badBody = JSON.parse(JSON.stringify(stepData.find(step => step.id === 'bad_step_data')));

  before((done) => {
    app = express();
    server = http.createServer(app);
    mock = server.listen(1300);
    app.on('middleware:after:session', (eventargs) => {
      auth.configurePassport(app);
    });
    app.on('start', () => {
      done();
    });
    app.use(kraken({
      basedir: process.cwd(),
      onconfig: (config, next) => {
        config.set('dataDir', 'testDataValidationStepTests');
        dataDir = `./${config.get('dataDir') || 'data'}`;
        BaseModel.initialStorageParameters(config);
        fs.mkdirSync(dataDir);
        // Inject a user.json for authentication
        fs.copyFileSync(`${process.cwd()}/test/data/mock-users.json`, `${dataDir}/users.json`);
        next(null, config);
      }
    }));
  });

  after(async () => {
    app.removeAllListeners('start');
    await rmdir(dataDir);
    await util.promisify(mock.close.bind(mock))();
  });

  it('Should fail insert on missing body', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .post('/api/v1/steps/')
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(400);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('message').eq('POST request missing body');
    await request(mock).get('/api/v1/steps').set('Cookie', [userInfo]).expect(204);
  });

  it('Should fail validation on insert', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .post('/api/v1/steps/')
      .set('Cookie', [userInfo])
      .send(badBody)
      .expect('Content-Type', /json/)
      .expect(422);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('errors').lengthOf(3);
    expect(stepResponse).to.have.property('body');
    const errors = stepResponse.errors;
    expect(errors.find(err => err.params.missingProperty === 'displayName')).to.exist;
    expect(errors.find(err => err.params.missingProperty === 'type')).to.exist;
    expect(errors.find(err => err.dataPath === '.id')).to.exist;
    await request(mock).get('/api/v1/steps').set('Cookie', [userInfo]).expect(204);
  });

  it('Should fail insert on bad type', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    badBody.displayName = 'Something to pass validation';
    badBody.type = 'action';
    const response = await request(mock)
      .post('/api/v1/steps/')
      .set('Cookie', [userInfo])
      .send(badBody)
      .expect('Content-Type', /json/)
      .expect(422);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('errors').lengthOf(2);
    expect(stepResponse).to.have.property('body');
    const errors = stepResponse.errors;
    expect(errors.find(err => err.dataPath === '.type')).to.exist;
    expect(errors.find(err => err.dataPath === '.id')).to.exist;
    await request(mock).get('/api/v1/steps').set('Cookie', [userInfo]).expect(204);
  });

  it('Should fail delete when missing record', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock).delete('/api/v1/steps/bad-id')
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(500);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('errors').eq('no records found for id bad-id');
  });

  it('Should fail update when missing record', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .put('/api/v1/steps/bad-id')
      .set('Cookie', [userInfo])
      .send(stepData.find(step => step.id === '0a296858-e8b7-43dd-9f55-88d00a7cd8fa'))
      .expect('Content-Type', /json/)
      .expect(422);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('errors').eq('update failed: id from object(0a296858-e8b7-43dd-9f55-88d00a7cd8fa) does not match id from url(bad-id)');
  });
});
