const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const rmdir = require('rimraf-promise');
const util = require('util');
const fs = require('fs');
const auth = require('../../lib/auth');
const TestHelpers = require('../helpers/TestHelpers');
const executionData = require('../data/executions');

describe('Executions API File Tests', () => {
  let dataDir;
  let app;
  let server;
  let mock;
  const state = {};
  const body = JSON.parse(JSON.stringify(executionData.find(execution => execution.id === 'Blank')));

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
        config.set('dataDir', 'testDataApplications');
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

  it('Should insert a single execution template', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .post('/api/v1/executions/')
      .set('Cookie', [userInfo])
      .send(body)
      .expect('Content-Type', /json/)
      .expect(201);
    const executionResponse = JSON.parse(response.text);
    expect(executionResponse).to.exist;
    expect(executionResponse).to.have.property('execution');
    const execution = executionResponse.execution;
    verifyExecution(execution, body);
  });

  it('Should get the inserted execution template', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .get(`/api/v1/executions/${body.id}`)
      .set('Cookie', [userInfo])
      // .expect('Content-Type', /json/)
      // .expect(200);
    const executionResponse = JSON.parse(response.text);
    expect(executionResponse).to.exist;
    expect(executionResponse).to.have.property('execution');
    const execution = executionResponse.execution;
    verifyExecution(execution, body);
  });

  it('Should get all execution templates', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .get('/api/v1/executions')
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    const executionResponse = JSON.parse(response.text);
    expect(executionResponse).to.exist;
    expect(executionResponse).to.have.property('executions').lengthOf(1);
    const execution = executionResponse.executions[0];
    verifyExecution(execution, body);
  });

  it('Should update a execution template', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    body.displayName = 'Red on the head fred';
    const response = await request(mock)
      .put(`/api/v1/executions/${body.id}`)
      .set('Cookie', [userInfo])
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);
    const executionResponse = JSON.parse(response.text);
    expect(executionResponse).to.exist;
    expect(executionResponse).to.have.property('execution');
    const execution = executionResponse.execution;
    verifyExecution(execution, body);
  });

  it('Should delete a execution template', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    await request(mock).delete(`/api/v1/executions/${body.id}`).set('Cookie', [userInfo]).expect(204);
    await request(mock).get('/api/v1/executions').set('Cookie', [userInfo]).expect(204);
  });

  it('Should upsert a single execution template', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .put(`/api/v1/executions/${body.id}`)
      .set('Cookie', [userInfo])
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);
    const executionResponse = JSON.parse(response.text);
    expect(executionResponse).to.exist;
    expect(executionResponse).to.have.property('execution');
    const execution = executionResponse.execution;
    verifyExecution(execution, body);
  });

  it('Should update a single execution template using post', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .post('/api/v1/executions/')
      .set('Cookie', [userInfo])
      .send(body)
      .expect('Content-Type', /json/)
      .expect(201);
    const executionResponse = JSON.parse(response.text);
    expect(executionResponse).to.exist;
    expect(executionResponse).to.have.property('execution');
    const execution = executionResponse.execution;
    verifyExecution(execution, body);
  });

  it('Should insert multiple execution templates', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const executionIds = ['Blank', 'Real', 'Three'];
    const data = executionData.filter(execution => executionIds.indexOf(execution.id) !== -1);
    let response = await request(mock)
      .post('/api/v1/executions/')
      .set('Cookie', [userInfo])
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201);
    let executionResponse = JSON.parse(response.text);
    expect(executionResponse).to.exist;
    expect(executionResponse).to.have.property('executions').lengthOf(3);
    executionResponse.executions.forEach(execution => verifyExecution(execution, data.find(s => s.id === execution.id)));
    response = await request(mock)
      .get('/api/v1/executions/')
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    executionResponse = JSON.parse(response.text);
    expect(executionResponse).to.exist;
    expect(executionResponse).to.have.property('executions').lengthOf(3);
  });

  function verifyExecution(execution, original) {
    expect(execution).to.have.property('id').equal(original.id);
    expect(execution).to.have.property('description').equal(original.description);
    expect(execution).to.have.property('mergeGlobals').equal(original.mergeGlobals);
    expect(execution).to.have.property('creationDate');
    expect(execution).to.have.property('modifiedDate');
    expect(execution).to.have.nested.property('pipelineListener.className').equal(original.pipelineListener.className);
    expect(execution).to.have.nested.property('securityManager.className').equal(original.securityManager.className);
    expect(execution).to.have.nested.property('stepMapper.className').equal(original.stepMapper.className);
    expect(execution).to.have.property('pipelineIds').lengthOf(original.pipelineIds.length);
    expect(execution.pipelineIds).to.have.deep.members(original.pipelineIds);
  }
});
