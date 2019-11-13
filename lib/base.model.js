const Ajv = require('ajv');
const uuid = require('uuid/v1');
const ValidationError = require('./ValidationError');

let storageParameters;

class BaseModel {
  constructor(name, schema) {
    this.storageModel = this.getStorageModel(name);
    this.validator = this.getValidator(schema);
  }

  static initialStorageParameters(params) {
    storageParameters = params;
  }

  getValidator(schema) {
    const ajv = new Ajv({allErrors: true});
    return ajv.compile(schema);
  }

  getStorageModel(collectionName) {
    const Model = require(`./${storageParameters.get('storageType')}-storage-model`);
    return new Model(collectionName, storageParameters);
  }

  async getAll() {
    return await this.storageModel.find({});
  }

  async createOne(record) {
    // assign uuid id when missing
    if (!record.id) {
      record.id = uuid();
    }

    // validate record
    const validation = this.validator(record);
    if (!validation) {
      throw new ValidationError('', this.validator.errors);
    } else {
      return await this.storageModel.addRecord({id: record.id}, record);
    }
  }

  async createMany(records) {
    let errorList = [];
    let successList = [];
    if (records) {
      for await (const record of records) {
        try {
          const results = await this.createOne(record);
          successList.push(results);
        } catch (err) {
          errorList.push({error: err, record: record});
        }
      }
    }
    return {errorList: errorList, successList: successList};
  }

  async getByKey(key) {
    const records = await this.storageModel.find(key);
    if (records.length > 1) {
      throw new Error('more than one record found for this key!');
    } else if (records.length === 1) {
      return records[0];
    } else {
      return null;
    }
  }

  async update(id, record) {
    const validation = this.validator(record);
    if (!validation) {
      throw Error(this.validator.errors.join(','));
    } else if (id !== record.id) {
      throw Error(`update failed: id from object(${record.id}) does not match id from url(${id})`);
    } else {
      return await this.storageModel.updateRecord({id: id}, record);
    }
  }

  async delete(id) {
    const key = {id: id};
    const records = await this.storageModel.find(key);
    if (records.length > 0) {
      await this.storageModel.deleteRecord(key);
      return `id ${id} successfully deleted!`;
    } else {
      throw Error(`no records found for id ${id}`);
    }
  }
}

module.exports = BaseModel;
