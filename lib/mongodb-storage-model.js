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
    // update the record handles adds
    return await this.updateRecord(key, record);
  }

  async updateRecord(key, record) {
    // determine if record exists and modify/initialize creation date
    const exists = await this.find(key);
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
    const results = await this.getCollection().findOneAndUpdate(key, {$set: record}, {
      upsert: true,
      returnOriginal: false
    });

    return results.value;
  }


  deleteRecord(query) {
    return this.getCollection().findOneAndDelete(query);
  }

}

module.exports = MongoDBModel;
