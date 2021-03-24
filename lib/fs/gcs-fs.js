const BaseFileSystem = require('./base-fs');
const fs = require('fs');
const {Storage} = require('@google-cloud/storage');

class GCSFileSystem extends BaseFileSystem {
  constructor(credentials, parameters) {
    super(credentials, parameters);
    this.storage = new Storage({
      scopes: 'https://www.googleapis.como/auth/cloud-platform',
      projectId: parameters['projectId'],
      credentials: credentials
    });

    this.bucket = this.storage.bucket(parameters['bucket']);
  }

  async listFiles(remoteFilePath) {
    const [files] = await this.bucket.getFiles({
      autoPaginate: false,
      delimiter: '/',
      prefix: remoteFilePath
    });
    return files.map(file => file.name);
  }

  async copyFile(localFilePath, remoteFilePath, forceCopy) {
    const file = this.bucket.file(remoteFilePath);
    const exists = await file.exists();
    if (exists[0]) {
      if (forceCopy) {
        await file.delete();
      } else {
        return;
      }
    }
    const inputStream = fs.createReadStream(localFilePath);
    return new Promise((resolve, reject) => {
      const writeStream = file.createWriteStream();
      inputStream.resume();
      inputStream.pipe(writeStream).on('open', (() => {
        inputStream.resume();
        inputStream.pipe(writeStream);
      }))
        .on('finish', (() => {
          writeStream.end();
          resolve();
        }))
        .on('error', ((err) => {
          reject(err);
        }))
    });
  }
}

module.exports = GCSFileSystem;
