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
const mUtils = require('../../lib/metalus-utils');
const UsersModel = require('../../models/users.model');

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
    expect(resp).to.not.have.property('secretKey');
    // Validate the secretKey was saved to the data store
    const userModel = new UsersModel();
    const user = await userModel.getUser(resp.id);
    expect(user).to.have.property('secretKey');
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
    expect(resp.users.find(user => user.username === 'dev')).to.not.have.property('secretKey');
    expect(resp.users.find(user => user.username === 'admin')).to.exist;
    expect(resp.users.find(user => user.username === 'admin')).to.not.have.property('secretKey');
  });

  it('Should change user password', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), {}, 'dev', 'dev');
    const userModel = new UsersModel();
    // Get the secretKey from the database how it is stored and decrypt
    let dbUser = await userModel.getUser('mock-dev-user');
    const dbSecretKey = mUtils.decryptString(dbUser.secretKey, mUtils.createSecretKeyFromString('dev'));
    const changePassword = {
      id: 'mock-dev-user',
      password: 'dev',
      newPassword: 'newdevpassword',
      verifyNewpassword: 'newdevpassword'
    };
    const response = await request(mock)
      .put('/api/v1/users/mock-dev-user/changePassword')
      .send(changePassword)
      .set('Cookie', [userInfo])
      .expect('Content-Type', /json/)
      .expect(200);
    const resp = JSON.parse(response.text);
    expect(resp).to.exist;
    expect(bcrypt.compareSync(changePassword.newPassword, resp.password)).to.equal(true);
    expect(resp).to.not.have.property('secretKey');
    // Validate the secretKey was saved to the data store
    user = await userModel.getUser(resp.id);
    expect(user).to.have.property('secretKey');
    const updatedKey = mUtils.decryptString(user.secretKey, mUtils.createSecretKeyFromString('newdevpassword'));
    expect(dbSecretKey).eq(updatedKey);
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
