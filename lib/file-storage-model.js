const fs = require('fs');
const mingo = require('mingo');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const stat = util.promisify(fs.stat);

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

  async getCollection() {
    const data = await readFile(this.filepath, 'utf8');
    return JSON.parse(data);
  }

  async writeJSONFile(content) {
    await writeFile(this.filepath, JSON.stringify(content), 'utf8');
  }

  async fileExists(filepath) {
    try {
      await stat(filepath);
      return true;
    } catch (err) {
      return false;
    }
  }

  async find(query) {
    try {
      const collection = await this.getCollection();
      return mingo.find(collection, query).all();
    } catch (err) {
      throw Error(err);
    }
  }

  async addRecord(key, record) {
    const results = await this.find(key);
    if (results.length > 0) {
      record.creationDate = results[0].creationDate || new Date();
      return await this.updateRecord(key, record);
    } else {
      record.creationDate = new Date();
      record.modifiedDate = new Date();
      const collection = await this.getCollection();
      collection.push(record);
      await this.writeJSONFile(collection);
      return record;
    }
  }

  async updateRecord(key, record) {
    const stored = await this.find(key);
    if (stored.length === 0) {
      return await this.addRecord(key, record);
    } else if (stored.length === 1) {
      await this.deleteRecord(key);
      record.modifiedDate = new Date();
      record.creationDate = stored[0].creationDate;
      const collection = await this.getCollection();
      collection.push(record);
      await this.writeJSONFile(collection);
      return record;
    } else {
      throw Error('multiple records found while attempting to update');
    }
  }

  async deleteRecord(query) {
    const collection = await this.getCollection();
    const coll = mingo.remove(collection, query);
    await this.writeJSONFile(coll);
  }

  async deleteRecords(query) {
    return await this.deleteRecord(query);
  }
}

module.exports = FileModel;
