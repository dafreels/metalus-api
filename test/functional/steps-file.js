const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const rmdir = require('rimraf');

let server;
let mock;
let app;

describe('Steps File Tests', () => {
  describe('Basic CRUD Tests', () => {
    let dataDir;
    const body = {
      id: '87db259d-606e-46eb-b723-82923349640f',
      displayName: 'Load DataFrame from HDFS',
      description: 'This step will create a dataFrame in a given format from HDFS',
      type: 'Pipeline',
      params: [
        {
          type: 'text',
          name: 'path',
          required: false
        },
        {
          type: 'text',
          name: 'format',
          required: false,
          defaultValue: 'parquet'
        },
        {
          type: 'text',
          name: 'properties',
          required: false
        }
      ],
      engineMeta: {
        spark: 'HDFSSteps.readFromHDFS'
      }
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
          config.set('dataDir', 'testDataSimpleStepTests');
          dataDir = `./${config.get('dataDir') || 'data'}`;
          BaseModel.initialStorageParameters(config);
          next(null, config);
        }
      }));
      mock = server.listen(1300);
    });

    after((done) => {
      rmdir(dataDir, () => {
        app.removeListener('start', done);
        mock.close(done);
      });
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
      verifyStep(step);
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
      verifyStep(step);
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
      verifyStep(step);
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
      verifyStep(step);
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
      verifyStep(step);
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
      verifyStep(step);
    });

    function verifyStep(step) {
      expect(step).to.have.property('id').equal(body.id);
      expect(step).to.have.property('displayName').equal(body.displayName);
      expect(step).to.have.property('type').equal(body.type);
      expect(step).to.have.property('creationDate');
      expect(step).to.have.property('modifiedDate');
      expect(step).to.have.nested.property('engineMeta.spark').equal(body.engineMeta.spark);
      expect(step).to.have.property('params').lengthOf(3);
      expect(step.params).to.have.deep.members(body.params);
    }
  });

  describe('Additional Tests', () => {
    let dataDir;
    before((done) => {
      app = express();
      server = http.createServer(app);
      app.on('start', () => {
        done();
      });
      app.use(kraken({
        basedir: process.cwd(),
        onconfig: (config, next) => {
          config.set('dataDir', 'testDataAddStepTests');
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

    it('SHould do something', async () => {

    })
  });
});
