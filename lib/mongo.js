const MongoClient = require('mongodb').MongoClient;

class MongoDb {
  constructor() {
    this.client = null;
    this.database = null;
  }

  getDatabase() {
    return this.client.db(this.database);
  }

  async init(config) {
    this.database = config.get('databaseName');
    if(!this.client) {
      this.client = await MongoClient.connect(MongoDb.buildConnectionUrl(config));
    }
  }

  static buildConnectionUrl(config) {
    let loginInfo = '';
    let password = config.get('databasePassword');
    // TODO Temporary code to handle AWS stuff until we can determine a better way
    if (password && password.indexOf('{') === 0) {
      password = JSON.parse(password).pipelineDriverPassword;
    } else if (password && password.pipelineDriverPassword) {
      password = password.pipelineDriverPassword;
    }
    if (config.get('databaseUser') && password) {
      loginInfo = `${config.get('databaseUser')}:${password}@`;
    }
    let protocol = 'mongodb';
    if (config.get('databaseSSL')) {
      protocol = 'mongodb+srv';
    }

    return `${protocol}://${loginInfo}${config.get('databaseServer')}/`;
  }

  async disconnect() {
    await this.client.close(true);
    this.client = null;
  }
}

const mongoDB = new MongoDb();

module.exports = mongoDB;
