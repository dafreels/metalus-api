const Promise = require('bluebird');
const MongoDb = require('./mongo');

class MongoDBModel {
  constructor(collectionName, config) {
    this.collectionName = collectionName;
    MongoDb.init(config);
  }

  getCollection() {
    return MongoDb.getDatabase().collection(this.collectionName);
  }

  find(query) {
    return new Promise((resolve, reject) => {
      this.getCollection().find(query).toArray()
        .then(results => {
          resolve(results);
        })
        .catch(err => reject(err));
    });
  }

  addRecord(key, record) {
    return this.find(key)
      .then(exists => {
        if (exists.length > 0) {
          record.creationDate = exists[0].creationDate;
        } else {
          record.creationDate = new Date();
        }
        record.modifiedDate = new Date();
        return this.updateRecord(key, record);
      });
  }

  updateRecord(key, record) {
    return new Promise((resolve, reject) => {
      this.find(key)
        .then(exists => {
          if (exists.length > 0) {
            record.creationDate = exists[0].creationDate;
          } else {
            record.creationDate = new Date();
          }
          record.modifiedDate = new Date();
          delete record._id;
          return this.getCollection().findOneAndUpdate(key, {$set: record}, {
            upsert: true,
            returnOriginal: false
          }, (err, doc) => {
            if (err) reject(err);
            resolve(doc.value);
          });
        });
    });
  }

  deleteRecord(query) {
    return this.getCollection().findOneAndDelete(query);
  }

}

module.exports = MongoDBModel;
