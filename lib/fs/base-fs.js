class BaseFileSystem {
  constructor(credentials, parameters) {
    this.credentials = credentials;
    this.parameters = parameters;
  }

  async listFiles(remoteFilePath) {
    throw new Error('Function (copyFile) not implemented!');
  }

  async copyFile(localFilePath, remoteFilePath, forceCopy) {
    throw new Error('Function (copyFile) not implemented!');
  }
}

module.exports = BaseFileSystem;
