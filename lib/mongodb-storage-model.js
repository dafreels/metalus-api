const MongoClient = require('mongodb').MongoClient;

class MongoDBModel {
  constructor(collectionName, config) {
    this.collectionName = collectionName;
    this.databaseName = config.get('databaseName');
    this.connectionUrl = MongoDBModel.buildConnectionUrl(config);
  }

  async find(query) {
    return new Promise(async (resolve, reject) => {
      return MongoClient.connect(this.connectionUrl, async (err, client) => {
        // find the items
        const items = await client.db(this.databaseName).collection(this.collectionName).find(query).toArray();
        // return the items
        resolve(items);
        // close connection
        await client.close();
      });
    });
  }

  async addRecord(key, record) {
    // update the record handles adds
    return new Promise(async (resolve, reject) => {
      return await this.updateRecord(key, record).then( (item) => {
        resolve(item);
      }).catch((err) => { reject(err) });
    });
  }

  async updateRecord(key, record) {
    return new Promise( async (resolve, reject) => {
      return await MongoClient.connect(this.connectionUrl,async (err, client) => {
        // get the collection
        const collection = client.db(this.databaseName).collection(this.collectionName);

        // see if item exists for the key provided
        const exists = await collection.find(key).toArray();

        // update re-use creation date or initialize if no item exists
        if (exists.length > 0) {
          record.creationDate = exists[0].creationDate;
        } else {
          record.creationDate = new Date();
        }

        // set the modified date to the current time
        record.modifiedDate = new Date();

        // delete _id from existing record if it exists
        delete record._id;

        // perform update
        const results = await collection.findOneAndUpdate(key, {$set: record}, { upsert: true, returnOriginal: false});

        resolve(results.value);

        // close client
        await client.close();
      });
    });
  }

  async deleteRecord(query) {
    return new Promise(async (resolve, reject) => {
      return await MongoClient.connect(this.connectionUrl, async(err, client) => {
        const results =  await client.db(this.databaseName).collection(this.collectionName)
          .findOneAndDelete(query);

        // return results
        resolve(results);

        // disconnect
        await client.close();
      });
    })

  }

  async dropDatabase() {
    return await MongoClient.connect(this.connectionUrl, async (err, client) => {
      await client.db(this.databaseName).dropDatabase();
      await client.close();
    });
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

}

module.exports = MongoDBModel;
