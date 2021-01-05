const schema = require('../schemas/steps.json');
const BaseModel = require('../lib/base.model');


class StepsModel extends BaseModel {
  constructor() {
    super('steps', schema);
    this.templatesModel = this.getStorageModel('stepTemplates');
  }

  // custom model logic goes here
  async getTemplate(id, user) {
    const key = {
      id,
    };
    if (user) {
      key.project = {
        userId: user.id,
        projectId: user.defaultProjectId
      };
    }
    const records = await this.templatesModel.find(key);
    if (records.length > 1) {
      throw new Error('more than one record found for this key!');
    } else if (records.length === 1) {
      return records[0];
    } else {
      return null;
    }
  }

  async updateTemplate(id, record, user) {
    const key = {
      id: record.id
    };
    let project;
    if (user) {
      project = {
        userId: user.id,
        projectId: user.defaultProjectId
      };
      record.project = project;
      key.project = project;
    }
    // const validation = this.validator(record);
    // if (!validation) {
    //   throw new ValidationError('', this.validator.errors);
    // } else if (id !== record.id) {
    //   throw new ValidationError('', `update failed: id from object(${record.id}) does not match id from url(${id})`);
    // } else {
      return await this.templatesModel.updateRecord(key, record);
    // }
  }
}

module.exports = StepsModel;
