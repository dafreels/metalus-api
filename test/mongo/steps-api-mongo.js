const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const stepData = require('../data/steps');
const MongoDb = require('../../lib/mongo');
const util = require('util');

describe('Steps API Mongo Tests', () => {
  let app;
  let server;
  let mock;
  const body = JSON.parse(JSON.stringify(stepData.find(step => step.id === '87db259d-606e-46eb-b723-82923349640f')));

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
        config.set('databaseName', 'testDataSteps');
        config.set('databaseServer', 'localhost');
        BaseModel.initialStorageParameters(config);
        MongoDb.init(config)
          .then(() => {
            MongoDb.getDatabase().dropDatabase();
            next(null, config);
          })
          .catch(next);
      }
    }));
    mock = server.listen(1308);
  });

  after(async () => {
    await MongoDb.getDatabase().dropDatabase();
    await MongoDb.disconnect();
    app.removeAllListeners('start');
    await util.promisify(mock.close.bind(mock));
  });

  it('Should insert a single step', async () => {
    const response = await request(mock)
      .post('/api/v1/steps/')
      .send(body)
      .expect('Content-Type', /json/)
      .expect(201);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('step');
    const step = stepResponse.step;
    verifyStep(step, body);
  });

  it('Should get the inserted step', async () => {
    const response = await request(mock)
      .get(`/api/v1/steps/${body.id}`)
      .expect('Content-Type', /json/)
      .expect(200);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('step');
    const step = stepResponse.step;
    verifyStep(step, body);
  });

  it('Should get all steps', async () => {
    const response = await request(mock)
      .get('/api/v1/steps')
      .expect('Content-Type', /json/)
      .expect(200);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('steps').lengthOf(1);
    const step = stepResponse.steps[0];
    verifyStep(step, body);
  });

  it('Should update a step', async () => {
    body.displayName = 'Red on the head fred';
    const response = await request(mock)
      .put(`/api/v1/steps/${body.id}`)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('step');
    const step = stepResponse.step;
    verifyStep(step, body);
  });

  it('Should delete a step', async () => {
    await request(mock).delete(`/api/v1/steps/${body.id}`).expect(204);
    await request(mock).get('/api/v1/steps').expect(204);
  });

  it('Should upsert a single step', async () => {
    const response = await request(mock)
      .put(`/api/v1/steps/${body.id}`)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('step');
    const step = stepResponse.step;
    verifyStep(step, body);
  });

  it('Should update a single step using post', async () => {
    const response = await request(mock)
      .post('/api/v1/steps/')
      .send(body)
      .expect('Content-Type', /json/)
      .expect(201);
    const stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('step');
    const step = stepResponse.step;
    verifyStep(step, body);
  });

  it('Should insert multiple steps', async () => {
    const stepIds = ['8daea683-ecde-44ce-988e-41630d251cb8', '0a296858-e8b7-43dd-9f55-88d00a7cd8fa', 'e4dad367-a506-5afd-86c0-82c2cf5cd15c'];
    const data = JSON.parse(JSON.stringify(stepData.filter(step => stepIds.indexOf(step.id) !== -1)));
    console.log(`data: ${JSON.stringify(data)}`);
    let response = await request(mock)
      .post('/api/v1/steps/')
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201);
    let stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('steps').lengthOf(3);
    stepResponse.steps.forEach(step => verifyStep(step, data.find(s => s.id === step.id)));
    response = await request(mock)
      .get('/api/v1/steps/')
      .expect('Content-Type', /json/)
      .expect(200);
    stepResponse = JSON.parse(response.text);
    expect(stepResponse).to.exist;
    expect(stepResponse).to.have.property('steps').lengthOf(4);
  });

  function verifyStep(step, original) {
    expect(step).to.have.property('id').equal(original.id);
    expect(step).to.have.property('displayName').equal(original.displayName);
    expect(step).to.have.property('type').equal(original.type);
    expect(step).to.have.property('creationDate');
    expect(step).to.have.property('modifiedDate');
    expect(step).to.have.nested.property('engineMeta.spark').equal(original.engineMeta.spark);
    expect(step).to.have.property('params').lengthOf(original.params.length);
    expect(step.params).to.have.deep.members(original.params);
  }
});
