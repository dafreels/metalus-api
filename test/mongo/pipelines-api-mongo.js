const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const stepData = require('../data/steps');
const MongoDb = require('../../lib/mongo');
const util = require('util');
const auth = require('../../lib/auth');
const TestHelpers = require('../helpers/TestHelpers');

describe('Pipelines API Mongo Tests', () => {
  let app;
  let server;
  let mock;
  const step1 = JSON.parse(JSON.stringify(stepData.find(step => step.id === '8daea683-ecde-44ce-988e-41630d251cb8')));
  step1.stepId = step1.id;
  step1.id = 'Load';
  step1.nextStepId = 'Write';
  const step2 = JSON.parse(JSON.stringify(stepData.find(step => step.id === '0a296858-e8b7-43dd-9f55-88d00a7cd8fa')));
  step2.stepId = step2.id;
  step2.id = 'Write';
  const pipeline = {
    name: 'Test Pipeline',
    description: 'Pipeline used for testing',
    steps: [
      step1,
      step2
    ]
  };
  const state = {};
  const mockUser = {
    id: 'mock-admin-user',
    username: 'admin',
    password: '$2b$08$6tMg/Tp8yhYgOT8fkcXFi.j7ViaiZrZzRzD/pPLofIGvUTf24s3W.',
    displayName: 'test admin user',
    role: 'admin',
    defaultProjectId: '1',
    projects: [
      {
        id: '1',
        displayName: 'Default Project'
      }
    ]
  };

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
        config.set('storageType', 'mongodb');
        config.set('databaseName', 'testDataPipelines');
        BaseModel.initialStorageParameters(config);
        MongoDb.init(config)
          .then(() => {
            return MongoDb.getDatabase().collection('users').findOneAndUpdate({id: 'mock-admin-user'},
              {$set: mockUser},
              {
                upsert: true,
                returnOriginal: false
              });
          })
          .then(() => {
            next(null, config);
          })
          .catch(next);
      }
    }));
  });

  after(async () => {
    app.removeAllListeners('start');
    await MongoDb.getDatabase().dropDatabase();
    await MongoDb.disconnect();
    await util.promisify(mock.close.bind(mock))();
  });

  it('Should fail to insert pipeline', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const badPipeline = {
      name: 'Bad Pipeline',
      steps: [
        {
          id: 'valid-id',
          type: 'pickles',
          params: [],
          engineMeta: {
            spark: 'nothing to see here',
            pkg: 'none'
          }
        }
      ]
    };
    const response = await request(mock)
      .post('/api/v1/pipelines/')
      .set('Cookie', [userInfo])
      .send(badPipeline)
      .expect('Content-Type', /json/)
      .expect(422);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('errors').lengthOf(4);
    expect(resp).to.have.property('body');
    const errors = resp.errors;
    expect(errors.find(err => err.params.missingProperty === 'stepId')).to.exist;
    expect(errors.find(err => err.params.missingProperty === 'displayName')).to.exist;
    expect(errors.find(err => err.params.missingProperty === 'stepId')).to.exist;
    expect(errors.find(err => err.dataPath === '.steps[0].type')).to.have.property('message').eq('should be equal to one of the allowed values');
    await request(mock).get('/api/v1/pipelines').set('Cookie', [userInfo]).expect(204);
  });

  it('Should insert a single pipeline', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .post('/api/v1/pipelines/')
      .set('Cookie', [userInfo])
      .send(pipeline)
      .expect('Content-Type', /json/)
      .expect(201);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipeline');
    verifyPipeline(resp.pipeline, pipeline);
    // Assign the pipeline id to the original pipeline for use in other tests
    pipeline.id = resp.pipeline.id;
  });

  it('Should get the inserted pipeline', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .get(`/api/v1/pipelines/${pipeline.id}`)
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipeline');
    verifyPipeline(resp.pipeline, pipeline);
  });

  it('Should get all pipelines', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .get('/api/v1/pipelines/')
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipelines').lengthOf(1);
    verifyPipeline(resp.pipelines[0], pipeline);
  });

  it('Should update a pipeline', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    pipeline.name = 'Red on the head fred';
    const response = await request(mock)
      .put(`/api/v1/pipelines/${pipeline.id}`)
      .set('Cookie', [userInfo])
      .send(pipeline)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipeline');
    verifyPipeline(resp.pipeline, pipeline);
  });

  it('Should delete a pipeline', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    await request(mock).delete(`/api/v1/pipelines/${pipeline.id}`).set('Cookie', [userInfo]).expect(204);
    await request(mock).get('/api/v1/pipelines').set('Cookie', [userInfo]).expect(204);
  });

  it('Should upsert a single pipeline', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .put(`/api/v1/pipelines/${pipeline.id}`)
      .set('Cookie', [userInfo])
      .send(pipeline)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipeline');
    verifyPipeline(resp.pipeline, pipeline);
  });

  it('Should update a single pipeline using post', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    pipeline.name = 'Some new name';
    const response = await request(mock)
      .post('/api/v1/pipelines/')
      .set('Cookie', [userInfo])
      .send(pipeline)
      .expect('Content-Type', /json/)
      .expect(201);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipeline');
    verifyPipeline(resp.pipeline, pipeline);
  });

  it('Should insert multiple pipelines', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const pipeline1 = JSON.parse(JSON.stringify(pipeline));
    pipeline1.id = 'b9fa820c-eda7-5c9c-91c9-13b2693ede10';
    const pipeline2 = JSON.parse(JSON.stringify(pipeline));
    pipeline2.id = 'a5ac7870-e4f8-57b1-84a2-f0e0ceaf0720';
    const data = [
      pipeline1,
      pipeline2
    ];
    let response = await request(mock)
      .post('/api/v1/pipelines/')
      .set('Cookie', [userInfo])
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201);
    let resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipelines').lengthOf(2);
    resp.pipelines.forEach(pipeline => verifyPipeline(pipeline, data.find(p => p.id === pipeline.id)));
    response = await request(mock)
      .get('/api/v1/pipelines/')
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipelines').lengthOf(3);
  });

  function verifyPipeline(pipeline, original) {
    expect(pipeline).to.have.property('id');
    expect(pipeline).to.have.property('name').equal(original.name);
    expect(pipeline).to.have.property('creationDate');
    expect(pipeline).to.have.property('modifiedDate');
    expect(pipeline).to.have.property('steps').lengthOf(original.steps.length);
    expect(pipeline.steps).to.have.deep.members(original.steps);
  }
});
