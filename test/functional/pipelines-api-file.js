const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const rmdir = require('rimraf');
const stepData = require('../data/steps');

describe('Pipelines API File Tests', () => {
  let dataDir;
  let app;
  let server;
  let mock;
  const step1 = stepData.find(step => step.id === '8daea683-ecde-44ce-988e-41630d251cb8');
  step1.stepId = step1.id;
  step1.id = 'Load';
  step1.nextStepId = 'Write';
  const step2 = stepData.find(step => step.id === '0a296858-e8b7-43dd-9f55-88d00a7cd8fa');
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

  before((done) => {
    app = express();
    server = http.createServer(app);
    app.on('start', () => {
      done();
    });
    app.use(kraken({
      basedir: process.cwd(),
      onconfig: (config, next) => {
        config.set('dataDir', 'testDataPipelines');
        dataDir = `./${config.get('dataDir') || 'data'}`;
        BaseModel.initialStorageParameters(config);
        next(null, config);
      }
    }));
    mock = server.listen(1303);
  });

  after((done) => {
    rmdir(dataDir, () => {
      app.removeListener('start', done);
      mock.close(done);
    });
  });

  it('Should fail to insert pipeline', async () => {
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
      .send(badPipeline)
      .expect('Content-Type', /json/)
      .expect(500);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('errors').lengthOf(3);
    expect(resp).to.have.property('body');
    const errors = resp.errors;
    expect(errors.find(err => err.params.missingProperty === 'stepId')).to.exist
    expect(errors.find(err => err.params.missingProperty === 'displayName')).to.exist
    expect(errors.find(err => err.dataPath === '.steps[0].type')).to.have.property('message').eq('should be equal to one of the allowed values');
    await request(mock).get('/api/v1/pipelines').expect(204);
  });

  it('Should insert a single pipeline', async () => {
    const response = await request(mock)
      .post('/api/v1/pipelines/')
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
    const response = await request(mock)
      .get(`/api/v1/pipelines/${pipeline.id}`)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipeline');
    verifyPipeline(resp.pipeline, pipeline);
  });

  it('Should get all pipelines', async () => {
    const response = await request(mock)
      .get('/api/v1/pipelines/')
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipelines').lengthOf(1);
    verifyPipeline(resp.pipelines[0], pipeline);
  });

  it('Should update a pipeline', async () => {
    pipeline.name = 'Red on the head fred';
    const response = await request(mock)
      .put(`/api/v1/pipelines/${pipeline.id}`)
      .send(pipeline)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipeline');
    verifyPipeline(resp.pipeline, pipeline);
  });

  it('Should delete a pipeline', async () => {
    await request(mock).delete(`/api/v1/pipelines/${pipeline.id}`).expect(204);
    await request(mock).get('/api/v1/pipelines').expect(204);
  });

  it('Should upsert a single pipeline', async () => {
    const response = await request(mock)
      .put(`/api/v1/pipelines/${pipeline.id}`)
      .send(pipeline)
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipeline');
    verifyPipeline(resp.pipeline, pipeline);
  });

  it('Should update a single pipeline using post', async () => {
    pipeline.name = 'Some new name';
    const response = await request(mock)
      .post('/api/v1/pipelines/')
      .send(pipeline)
      .expect('Content-Type', /json/)
      .expect(201);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipeline');
    verifyPipeline(resp.pipeline, pipeline);
  });

  it('Should insert multiple pipelines', async () => {
    const pipeline1 = JSON.parse(JSON.stringify(pipeline));
    pipeline1.id = 'pipeline1';
    const pipeline2 = JSON.parse(JSON.stringify(pipeline));
    pipeline2.id = 'pipeline2';
    const data = [
      pipeline1,
      pipeline2
    ];
    let response = await request(mock)
      .post('/api/v1/pipelines/')
      .send(data)
      .expect('Content-Type', /json/)
      .expect(201);
    let resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('pipelines').lengthOf(2);
    resp.pipelines.forEach(pipeline => verifyPipeline(pipeline, data.find(p => p.id === pipeline.id)));
    response = await request(mock)
      .get('/api/v1/pipelines/')
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
