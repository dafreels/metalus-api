const request = require('supertest');
const http = require('http');
const express = require('express');
const kraken = require('kraken-js');
const BaseModel = require('../../lib/base.model');
const expect = require('chai').expect;
const MongoDb = require('../../lib/mongo');
const util = require('util');
const auth = require('../../lib/auth');
const TestHelpers = require('../helpers/TestHelpers');
const bcrypt = require('bcrypt');
const fs = require('fs');
const mUtils = require('../../lib/metalus-utils');
const UsersModel = require('../../models/users.model');

describe('Users API Mongo Tests', () => {
  let app;
  let server;
  let mock;
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
        config.set('databaseName', 'testDataUsers');
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
    await mUtils.removeDir('jars');
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
    expect(resp).to.have.property('id').eq('mock-dev-user');
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
    delete state.authCookie;
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

  it('Should fail to upload a jar file to the wrong user', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    await request(mock)
      .post(`/api/v1/users/bad-user/project/1/upload`)
      .set('Cookie', [userInfo])
      .expect(500);
  });

  it('Should upload a jar file to the first project', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    let filename = 'test.jar';
    let projectId = mockUser.projects[0].id;
    expect(fs.existsSync(`test/data/${filename}`));
    expect(!fs.existsSync(`jars/${mockUser.id}/${projectId}/${filename}`));
    await request(mock)
      .post(`/api/v1/users/${mockUser.id}/project/${projectId}/upload`)
      .set('Cookie', [userInfo])
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .field('Content-Type', 'multipart/form-data')
      .field('file', filename)
      .attach('files', `test/data/${filename}`)
      .expect(200);

    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/${filename}`));
    const initialModTime = fs.statSync(`jars/${mockUser.id}/${projectId}/${filename}`).mtimeMs;

    // upload a 2nd file
    filename = 'test2.jar';
    expect(fs.existsSync(`test/data/${filename}`));
    expect(!fs.existsSync(`jars/${mockUser.id}/${projectId}/${filename}`));
    await request(mock)
      .post(`/api/v1/users/${mockUser.id}/project/${projectId}/upload`)
      .set('Cookie', [userInfo])
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .field('Content-Type', 'multipart/form-data')
      .field('file', filename)
      .attach('files', `test/data/${filename}`)
      .expect(200);

    // make sure both files are still there
    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/${filename}`));
    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/test.jar`));

    // test overwrite existing (check modified date was updated
    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/${filename}`));
    await request(mock)
      .post(`/api/v1/users/${mockUser.id}/project/${projectId}/upload`)
      .set('Cookie', [userInfo])
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .field('Content-Type', 'multipart/form-data')
      .field('file', filename)
      .attach('files', `test/data/${filename}`)
      .expect(200);

    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/${filename}`));
    const updateModTime = fs.statSync(`jars/${mockUser.id}/${projectId}/${filename}`).mtimeMs;
    expect(updateModTime > initialModTime);
  });

  it('Should delete an existing jar file', async () => {
    let userInfo = await TestHelpers.authUser(request(mock), state);
    let projectId = mockUser.projects[0].id;
    // no file exists
    await request(mock)
      .delete(`/api/v1/users/${mockUser.id}/project/${projectId}/files/bad.jar`)
      .set('Cookie', [userInfo])
      .expect(204);

    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/test.jar`));
    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/test2.jar`));
    await request(mock)
      .delete(`/api/v1/users/${mockUser.id}/project/${projectId}/files/test.jar`)
      .set('Cookie', [userInfo])
      .expect(200);
    expect(!fs.existsSync(`jars/${mockUser.id}/${projectId}/test.jar`));
    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/test2.jar`));

    // can't delete a different users file
    await request(mock)
       .delete(`/api/v1/users/mock-dev-user/project/1/files/test2.jar`)
       .send(mockUser)
       .set('Cookie', [userInfo])
       .expect(500);
  });

  it('Should fail to upload a jar file to the wrong user', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    await request(mock)
      .post(`/api/v1/users/bad-user/project/1/upload`)
      .set('Cookie', [userInfo])
      .expect(500);
  });

  it('Should upload a jar file to the first project', async () => {
    const userInfo = await TestHelpers.authUser(request(mock), state);
    let filename = 'test.jar';
    let projectId = mockUser.projects[0].id;
    expect(fs.existsSync(`test/data/${filename}`));
    expect(!fs.existsSync(`jars/${mockUser.id}/${projectId}/${filename}`));
    await request(mock)
      .post(`/api/v1/users/${mockUser.id}/project/${projectId}/upload`)
      .set('Cookie', [userInfo])
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .field('Content-Type', 'multipart/form-data')
      .field('file', filename)
      .attach('files', `test/data/${filename}`)
      .expect(200);

    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/${filename}`));
    const initialModTime = fs.statSync(`jars/${mockUser.id}/${projectId}/${filename}`).mtimeMs;

    // upload a 2nd file
    filename = 'test2.jar';
    expect(fs.existsSync(`test/data/${filename}`));
    expect(!fs.existsSync(`jars/${mockUser.id}/${projectId}/${filename}`));
    await request(mock)
      .post(`/api/v1/users/${mockUser.id}/project/${projectId}/upload`)
      .set('Cookie', [userInfo])
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .field('Content-Type', 'multipart/form-data')
      .field('file', filename)
      .attach('files', `test/data/${filename}`)
      .expect(200);

    // make sure both files are still there
    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/${filename}`));
    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/test.jar`));

    // test overwrite existing (check modified date was updated)
    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/${filename}`));
    await request(mock)
      .post(`/api/v1/users/${mockUser.id}/project/${projectId}/upload`)
      .set('Cookie', [userInfo])
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .field('Content-Type', 'multipart/form-data')
      .field('file', filename)
      .attach('files', `test/data/${filename}`)
      .expect(200);

    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/${filename}`));
    const updateModTime = fs.statSync(`jars/${mockUser.id}/${projectId}/${filename}`).mtimeMs;
    expect(updateModTime > initialModTime);
  });

  it('Should upload a file as a different user', async() => {
    const devState = {};
    const userInfo = await TestHelpers.authUser(request(mock), devState, 'dev', 'newdevpassword');
    // let resp = JSON.parse(response.text);
    // const user = resp.users.find(user => user.username === 'dev');
    const filename = 'test.jar';
    expect(!fs.existsSync(`jars/mock-dev-user/1/${filename}`));
    await request(mock)
      .post(`/api/v1/users/mock-dev-user/project/1/upload`)
      .set('Cookie', [userInfo])
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .field('Content-Type', 'multipart/form-data')
      .field('file', filename)
      .attach('files', `test/data/${filename}`)
      .expect(200);
    expect(fs.existsSync(`jars/mock-dev-user/1/${filename}`));

    // upload to a different project
    expect(!fs.existsSync(`jars/mock-dev-user/2/${filename}`));
    await request(mock)
      .post(`/api/v1/users/mock-dev-user/project/2/upload`)
      .set('Cookie', [userInfo])
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .field('Content-Type', 'multipart/form-data')
      .field('file', filename)
      .attach('files', `test/data/${filename}`)
      .expect(200);
    expect(fs.existsSync(`jars/mock-dev-user/2/${filename}`));

    // upload to a project that doesn't exist, should fail
    expect(!fs.existsSync(`jars/mock-dev-user/bad-project/${filename}`));
    await request(mock)
      .post(`/api/v1/users/mock-dev-user/project/bad-project/upload`)
      .set('Cookie', [userInfo])
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .field('Content-Type', 'multipart/form-data')
      .field('file', filename)
      .attach('files', `test/data/${filename}`)
      .expect(500);
    expect(!fs.existsSync(`jars/mock-dev-user/bad-project/${filename}`));
  });

  it('Should delete an existing jar file', async () => {
    let userInfo = await TestHelpers.authUser(request(mock), state);
    let projectId = mockUser.projects[0].id;
    // no file exists
    await request(mock)
      .delete(`/api/v1/users/${mockUser.id}/project/${projectId}/files/bad.jar`)
      .set('Cookie', [userInfo])
      .expect(204);

    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/test.jar`));
    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/test2.jar`));
    await request(mock)
      .delete(`/api/v1/users/${mockUser.id}/project/${projectId}/files/test.jar`)
      .set('Cookie', [userInfo])
      .expect(200);
    expect(!fs.existsSync(`jars/${mockUser.id}/${projectId}/test.jar`));
    expect(fs.existsSync(`jars/${mockUser.id}/${projectId}/test2.jar`));

    // can't delete a different users file
    await request(mock)
       .delete(`/api/v1/users/mock-dev-user/project/1/files/test2.jar`)
       .send(mockUser)
       .set('Cookie', [userInfo])
       .expect(500);
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

    // make sure the project folder is deleted from the filesystem
    expect(!fs.existsSync(`/api/v1/users/${user.id}/project/2`));
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
    await request(mock)
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
