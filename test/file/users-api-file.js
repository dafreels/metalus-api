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
const bcrypt = require('bcrypt');

describe('Users API File Tests', () => {
  let dataDir;
  let app;
  let server;
  let mock;
  const state = {};
  const body = {
    "id": "mock-dev-user",
    "username": "dev",
    "password": "dev",
    "displayName": "test dev user",
    "role": "developer",
    "defaultProjectId": "1",
    "projects": [
      {
        "id": "1",
        "displayName": "Default Project"
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
        config.set('dataDir', 'testDataUsers');
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
      .post('/api/v1/users/')
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(400);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('message').eq('POST request missing body');
  });

  it('Should fail to insert a single application', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const badApp = JSON.parse(JSON.stringify(body));
    delete badApp.username;
    delete badApp.projects;
    const response = await request(mock)
      .post('/api/v1/users/')
      .set('Cookie', [userInfo])
      .send(badApp)
      .expect('Content-Type', /json/)
      .expect(422);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('errors').lengthOf(2);
    expect(resp).to.have.property('body');
    const errors = resp.errors;
    expect(errors.find(err => err.params.missingProperty === 'projects')).to.exist;
    expect(errors.find(err => err.params.missingProperty === 'username')).to.exist;
  });

  it('Should insert a user', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .post('/api/v1/users/')
      .set('Cookie', [userInfo])
      .send(body)
      .expect('Content-Type', /json/)
      .expect(201);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('id');
  });

  it('Should get all users', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    const response = await request(mock)
      .get('/api/v1/users/')
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('users').lengthOf(2);
    expect(resp.users.find(user => user.username === 'dev')).to.exist;
    expect(resp.users.find(user => user.username === 'admin')).to.exist;
  });

  it('Should change user password', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    let response = await request(mock)
      .get('/api/v1/users/')
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    let resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('users').lengthOf(2);
    const user = resp.users.find(user => user.username === 'dev');
    const changePassword = {
      id: user.id,
      password: user.password,
      newPassword: 'newdevpassword',
      verifyNewpassword: 'newdevpassword'
    };
    response = await request(mock)
      .put(`/api/v1/users/${user.id}/changePassword`)
      .send(changePassword)
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(bcrypt.compareSync(changePassword.newPassword, resp.password)).to.equal(true);
  });

  it('Should change user', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    let response = await request(mock)
      .get('/api/v1/users/')
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    let resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('users').lengthOf(2);
    const user = resp.users.find(user => user.username === 'dev');
    expect(user).to.have.property('projects').lengthOf(1);
    user.projects.push({
      id: '2',
      displayName: 'Second Project'
    });
    user.password = '';
    response = await request(mock)
      .put(`/api/v1/users/${user.id}`)
      .send(user)
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('projects').lengthOf(2);
  });

  it('Should delete user project', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    let response = await request(mock)
      .get('/api/v1/users/')
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    let resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('users').lengthOf(2);
    const user = resp.users.find(user => user.username === 'dev');
    expect(user).to.have.property('projects').lengthOf(2);
    response = await request(mock)
      .delete(`/api/v1/users/${user.id}/project/2`)
      .send(user)
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('projects').lengthOf(1);
  });

  it('Should delete user', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    let response = await request(mock)
      .get('/api/v1/users/')
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    let resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('users').lengthOf(2);
    const user = resp.users.find(user => user.username === 'dev');
    response = await request(mock)
      .delete(`/api/v1/users/${user.id}`)
      .send(user)
      .set('Cookie', [userInfo])
      .expect(204);
    response = await request(mock)
      .get('/api/v1/users/')
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(resp).to.have.property('users').lengthOf(1);
    expect(resp.users.find(user => user.username === 'admin')).to.exist;
  });
});
