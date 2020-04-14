const MongoDb = require('./mongo');

class MongoDBModel {
  constructor(collectionName, config) {
    this.collectionName = collectionName;
    MongoDb.init(config);
  }

  getCollection() {
    return MongoDb.getDatabase().collection(this.collectionName);
  }

  async find(query) {
    return await this.getCollection().find(query).toArray();
  }

  async addRecord(key, record) {
    const exists = await this.find(key);
    if (exists.length > 0) {
      record.creationDate = exists[0].creationDate;
    } else {
      record.creationDate = new Date();
    }
    record.modifiedDate = new Date();
    return await this.updateRecord(key, record);
  }

  async updateRecord(key, record) {
    const exists = await this.find(key);
    if (exists.length > 0) {
      record.creationDate = exists[0].creationDate;
    } else {
      record.creationDate = new Date();
    }
    record.modifiedDate = new Date();
    delete record._id;
    const doc = await this.getCollection().findOneAndUpdate(key, {$set: record}, {
      upsert: true,
      returnOriginal: false
    });
    return doc.value;
  }

  async deleteRecord(query) {
    return await this.getCollection().findOneAndDelete(query);
  }

  async deleteRecords(query) {
    return await this.getCollection().deleteMany(query);
  }
}

module.exports = MongoDBModel;
