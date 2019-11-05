const fs = require('fs');
const mingo = require('mingo');

class FileModel {
  constructor(name, params) {
    this.storageParameters = params;
    this.dataDir = `./${this.storageParameters.get('dataDir') || 'data'}`;
    this.filepath = `${this.dataDir}/${name}.json`;

    fs.promises.mkdir(this.dataDir, {recursive: true})
      .then(() => {
        return this.fileExists(this.filepath);
      })
      .then((res) => {
        if (!res) {
          this.writeJSONFile([]);
        }
      });
  }

  getCollection() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filepath, 'utf8', (error, data) => {
        if (error) {
          reject(error);
        }
        resolve(JSON.parse(data || {}));
      });
    });
  }

  writeJSONFile(content) {
    fs.writeFileSync(this.filepath, JSON.stringify(content), 'utf8');
  }

  async fileExists(filepath) {
    await fs.stat(filepath, (err) => {
      return err;
    });
  }

  async find(query) {
    try {
      // get the file as a collection and return item(s) found
      const collection = await this.getCollection();
      return mingo.find(collection, query).all();
    } catch(err) {
      throw err;
    }
  }

  async addRecord(key, record) {
    let stored;
    try {
      // attempt to find the record to be added
      stored = await this.find(key);
    } catch(err) {
      throw err;
    }

    if (stored.length > 0) {
      // if record exists, preserve the creationDate and update the record
      record.creationDate = stored[0].creationDate || new Date();
      return await this.updateRecord(key, record)
    } else {
      // if record does not exist, create a new one with the creation and modified dates
      record.creationDate = new Date();
      record.modifiedDate = new Date();
      try {
        // add and return new record
        const collection = await this.getCollection();
        collection.push(record);
        this.writeJSONFile(collection);
        return record;
      } catch(err) {
        throw err;
      }
    }
  }

  async updateRecord(key, record) {
    let stored;
    try {
      // attempt to find the record to be updated
      stored = await this.find(key);
    } catch(err) {
      throw err;
    }

    if (stored.length === 0) {
      // if there are no records, just add it as new
      return await this.addRecord(key, record);
    } else if (stored.length === 1) {
      // if there is exactly one, delete what's out there
      await this.deleteRecord(key);
      // and update the modified date (retain the creationDate)
      record.modifiedDate = new Date();
      record.creationDate = stored[0].creationDate;
      const collection = await this.getCollection();
      // add updated record and return
      collection.push(record);
      this.writeJSONFile(collection);
      return record;
    } else {
      // throw an error when more than one exists
      throw 'multiple records found while attempting to update';
    }
  }

  async deleteRecord(query) {
    try {
      // attempt to find the record before deleting
      let collection = await this.getCollection();
      // delete the record
      collection = mingo.remove(collection, query);
      // return the deleted record
      return this.writeJSONFile(collection);
    } catch(err) {
      throw err;
    }
  }
}

module.exports = FileModel;
