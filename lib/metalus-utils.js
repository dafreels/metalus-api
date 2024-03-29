const util = require('util');
const fs = require('fs');
const execFile = require('child_process').execFile;
const crypto = require('crypto');
const stream = require("stream");
const bcrypt = require('bcrypt');

const algorithm = 'aes-256-ctr';
const initializationVector = '1d3eb9192c47fa0b';

const MetalusUtils = function() {};

let masterKey = '';
let previousMasterKey = '';

MetalusUtils.rmdir = util.promisify(fs.rmdir);
MetalusUtils.unlink = util.promisify(fs.unlink);
MetalusUtils.readdir = util.promisify(fs.readdir);
MetalusUtils.readfile = util.promisify(fs.readFile);
MetalusUtils.writefile = util.promisify(fs.writeFile);
MetalusUtils.stat = util.promisify(fs.stat);
MetalusUtils.mkdir = util.promisify(fs.mkdir);
MetalusUtils.rename = util.promisify(fs.rename);
MetalusUtils.exec = util.promisify(execFile);
MetalusUtils.pipeline = util.promisify(stream.pipeline);
MetalusUtils.exists = fs.existsSync;

MetalusUtils.MAX_SESSION_AGE = 1000 * 60 * 60 * 4; // 4 hours

MetalusUtils.determineDefaultMetalusVersion = async () => {
  const versionInfo = {
    version: '1.8.4',
    spark: '3.1',
    scala: '2.12'
  };
  try {
    const jars = await MetalusUtils.readdir(`${process.cwd()}/metalus-utils/libraries`);
    const jarName = jars.find(j => j.startsWith('metalus-core'));
    return MetalusUtils.getMetalusVersionInfo(jarName);
  } catch(err) {
    return versionInfo;
  }
};

MetalusUtils.getMetalusVersionInfo = (jarName) => {
  const versionInfo = {};
  const sparkIndex = jarName.indexOf('-spark_') + 7;
  versionInfo.component = jarName.substring(0, sparkIndex - 12);
  versionInfo.version = jarName.substring(sparkIndex + 4, jarName.indexOf('.jar'));
  versionInfo.spark = jarName.substring(sparkIndex, sparkIndex + 3);
  versionInfo.scala = jarName.substring(jarName.indexOf('_') + 1, jarName.indexOf('-spark'));
  return versionInfo
};

MetalusUtils.stringToStream = (string) => {
  stream.from([string]);
};

MetalusUtils.getProjectJarsBaseDir = (req) => {
  return req.app.kraken.get('baseJarsDir') || `${process.cwd()}/jars`;
};

MetalusUtils.generateSecretKey = () => {
  const key = crypto.randomBytes(48).toString('hex');
  return crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);
};

MetalusUtils.createSecretKeyFromString = (str) => {
  return crypto.createHash('sha256').update(str.padEnd(30, '*')).digest('base64').substr(0, 32);
};

MetalusUtils.encryptString = (str, secretKey) => {
  const cipher = crypto.createCipheriv(algorithm, secretKey, initializationVector);
  return Buffer.concat([cipher.update(str), cipher.final()]).toString('hex');
};

MetalusUtils.decryptString = (str, secretKey) => {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, initializationVector);
  return Buffer.concat([decipher.update(Buffer.from(str, 'hex')), decipher.final()]).toString();
};

MetalusUtils.clone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

MetalusUtils.generateClasspath = async (jarFiles, stagingDir, pathPrefix, repos, scopes) => {
  if (jarFiles.length > 0) {
    const parameters = [
      '--output-path',
      stagingDir,
      '--jar-files',
      jarFiles.join(','),
      '--path-prefix',
      pathPrefix
    ];
    if (repos && repos.trim().length > 0) {
      parameters.push('--repo');
      parameters.push(repos);
    }
    if (scopes && scopes.trim().length > 0) {
      parameters.push('--include-scopes');
      parameters.push(scopes);
    }
    let error = false;
    try {
      const {stdout, stderr} = await MetalusUtils.exec(`${process.cwd()}/metalus-utils/bin/dependency-resolver.sh`, parameters, {maxBuffer: 1024 * 10000});
      if (stderr) {
        MetalusUtils.log(stderr);
        error = true;
      } else {
        const output = stdout.trim().split('\n');
        output.forEach(o => MetalusUtils.log(o));
        return output[output.length - 1];
      }
    } catch(err) {
      error = true;
      MetalusUtils.log(`Error generating classpath: ${err}`);
      MetalusUtils.log(`Error generating classpath (error): ${JSON.stringify(err)}`);
    }

    if (error) {
      throw new Error(`Unable to generate classpath for jarFiles: ${jarFiles.join(',')}`);
    }
  }

  return '';
}

MetalusUtils.removeDir = function removeDir(path) {
  let files = [];
  if( fs.existsSync(path) ) {
    if (fs.lstatSync(path).isDirectory()) {
      files = fs.readdirSync(path);
      files.forEach(function (file) {
        const curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          removeDir(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    } else {
      fs.unlinkSync(path);
    }
  }
};

MetalusUtils.log = (txt) => {
  console.log(`${new Date().toDateString()} ${txt}`);
};

/**
 * Returns the master encryption key
 * @returns {string} The master encryption key
 */
MetalusUtils.getMasterKey = () => {
  return masterKey;
};

/**
 * Returns the previous master encryption key
 * @returns {string} The previous master encryption key
 */
MetalusUtils.getPreviousMasterKey = () => {
  return previousMasterKey;
};

/**
 * Set the master and previous master keys.
 * @param key The current master key
 * @param previousKey The previous master key
 */
MetalusUtils.initializeMasterKeys = (key, previousKey) => {
  masterKey = key;
  previousMasterKey = previousKey;
};

/**
 * Determines if the provided password matches the user password.
 * @param password The password to compare
 * @param user The user being authenticated
 * @returns {{match: boolean, decryptionMethod: string}} An object containing the match result and the method used to verify.
 */
MetalusUtils.verifyPassword = (password, user) => {
  const result = {
    match: false,
    decryptionMethod: 'hash'
  };
  if (!user) {
    return result;
  }
  if (!bcrypt.compareSync(password, user.password)) {
    let decryptedPassword = MetalusUtils.decryptString(user.password, masterKey);
    if (decryptedPassword !== password) {
      decryptedPassword = MetalusUtils.decryptString(user.password, previousMasterKey);
      result.match = decryptedPassword === password;
      result.decryptionMethod = result.match ? 'previousMasterKey' : 'none';
    } else {
      result.match = true;
      result.decryptionMethod = 'masterKey';
    }
  } else {
    result.match = true;
  }

  return result;
};

/**
 * Handles re-encrypting the password and secret key for the user.
 * @param passwordResult Object provided by the verifyPassword function indicating decryption method used
 * @param password The user password
 * @param user The user object
 * @returns {{updateUser: boolean, encryptKey: string, user: ({secretKey}|*)}} Objecting indicating actions taken.
 */
MetalusUtils.handleEncryptionKeyChange = (passwordResult, password, user) => {
  let key = MetalusUtils.getPreviousMasterKey();
  const encryptKey = MetalusUtils.getMasterKey();
  let secretKey;
  let updateUser = false;
  switch (passwordResult.decryptionMethod) {
    case 'hash':
      key = MetalusUtils.createSecretKeyFromString(password);
    case 'previousMasterKey':
      updateUser = true;
      user.password = MetalusUtils.encryptString(password, encryptKey);
      // If this user does not have a secret key, create one and save it
      if (!user.secretKey) {
        secretKey = MetalusUtils.generateSecretKey();
        user.secretKey = MetalusUtils.encryptString(secretKey, encryptKey);
      } else {
        user.secretKey = MetalusUtils.encryptString(MetalusUtils.decryptString(user.secretKey, key), encryptKey);
      }
      user.version = 2;
      break;
    default:
      user.password = MetalusUtils.encryptString(password, encryptKey);
      user.version = 2;
  }

  return {
    user,
    updateUser,
    encryptKey
  };
};

module.exports = MetalusUtils;
