const BaseFileSystem = require('./base-fs');
const fs = require('fs');
const { S3 } = require("@aws-sdk/client-s3");

class S3FileSystem extends BaseFileSystem {
  constructor(credentials, parameters) {
    super(credentials, parameters);
    this.s3Client = new S3({
      region: parameters.region,
      credentials,
    });

    this.bucket = parameters.bucket;
  }

  async listFiles(remoteFilePath) {
    const fileResponse = await this.s3Client.listObjectsV2({
      Bucket: this.bucket,
      Delimiter: '/',
      Prefix: remoteFilePath
    });
    const fileList = fileResponse.Contents || [];
    return fileList.filter(f => !f.Key.endsWith('/')).map(file => file.Key.substring(file.Key.lastIndexOf('/') + 1));
  }

  async copyFile(localFilePath, remoteFilePath, forceCopy) {
    const fileResponse = await this.s3Client.listObjectsV2({
      Bucket: this.bucket,
      Delimiter: '/',
      Prefix: remoteFilePath
    });
    if (fileResponse.Contents && fileResponse.Contents.length > 0) {
      if (forceCopy) {
        await this.s3Client.deleteObject({
          Key: remoteFilePath,
          Bucket: this.bucket
        });
      } else {
        return;
      }
    }
    await this.s3Client.putObject({
      Body: fs.createReadStream(localFilePath),
      Key: remoteFilePath,
      Bucket: this.bucket
    });
  }
}

module.exports = S3FileSystem;
