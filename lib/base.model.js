const Ajv = require('ajv');
const uuid = require('uuid/v1');
const ValidationError = require('./ValidationError');

let storageParameters;

class BaseModel {
  constructor(name, schema, ignoreProject = false) {
    this.model = require(`./${storageParameters.get('storageType')}-storage-model`);
    this.storageModel = this.getStorageModel(name);
    this.validator = this.getValidator(schema);
    this.ignoreProject = ignoreProject;
  }

  static initialStorageParameters(params) {
    storageParameters = params;
  }

  getValidator(schema) {
    const ajv = new Ajv({allErrors: true});
    return ajv.compile(schema);
  }

  getStorageModel(collectionName) {
    return new this.model(collectionName, storageParameters);
  }

  async getAll(user) {
    const key = {};
    if (user) {
      key.project = {
        userId: user.id,
        projectId: this.ignoreProject ? undefined : user.defaultProjectId
      };
    }
    return await this.storageModel.find(key);
  }

  async createOne(record, user) {
    // assign uuid id when missing
    if (!record.id) {
      record.id = uuid();
    }

    if (user) {
      record.project = {
        userId: user.id,
        projectId: this.ignoreProject ? undefined : user.defaultProjectId
      };
    }
    // validate record
    const validation = this.validator(record);
    if (!validation) {
      throw new ValidationError('', this.validator.errors);
    } else {
      const key = {
        id: record.id,
        project: record.project
      };
      return await this.storageModel.addRecord(key, record);
    }
  }

  async createMany(records, user) {
    let errorList = [];
    let successList = [];
    if (records) {
      for await (const record of records) {
        try {
          const results = await this.createOne(record, user);
          successList.push(results);
        } catch (err) {
          errorList.push({error: err, record: record});
        }
      }
    }
    return {errorList: errorList, successList: successList};
  }

  async getByKey(key, user) {
    if (user) {
      key.project = {
        userId: user.id,
        projectId: this.ignoreProject ? undefined : user.defaultProjectId
      };
    }
    const records = await this.storageModel.find(key);
    if (records.length > 1) {
      throw new Error('more than one record found for this key!');
    } else if (records.length === 1) {
      return records[0];
    } else {
      return null;
    }
  }

  async findByKey(key, user) {
    if (user) {
      key.project = {
        userId: user.id,
        projectId: this.ignoreProject ? undefined : user.defaultProjectId
      };
    }
    return this.storageModel.find(key);
  }

  async getCount(key) {
    return this.storageModel.count(key);
  }

  async update(id, record, user) {
    const key = {
      id: record.id
    };
    let project;
    if (user) {
      project = {
        userId: user.id,
        projectId: this.ignoreProject ? undefined : user.defaultProjectId
      };
      record.project = project;
      key.project = project;
    }
    const validation = this.validator(record);
    if (!validation) {
      throw new ValidationError('', this.validator.errors);
    } else if (id !== record.id) {
      throw new ValidationError('', `update failed: id from object(${record.id}) does not match id from url(${id})`);
    } else {
      return this.storageModel.updateRecord(key, record);
    }
  }

  async delete(id, user) {
    const key = {
      id
    };
    if (user) {
      key.project = {
        userId: user.id,
        projectId: this.ignoreProject ? undefined : user.defaultProjectId
      };
    }
    const records = await this.storageModel.find(key);
    if (records.length > 0) {
      await this.storageModel.deleteRecord(key);
      return `id ${id} successfully deleted!`;
    } else {
      throw Error(`no records found for id ${id}`);
    }
  }

  async deleteMany(key) {
    await this.storageModel.deleteRecords(key);
  }
}

module.exports = BaseModel;
