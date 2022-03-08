const BaseModel = require('../lib/base.model');
const schema = require('../schemas/jobs.json');

class JobsModel extends BaseModel {
  constructor() {
    super('jobs', schema, true);
  }

  async getByProvider(providerId, user) {
    const key = {
      providerId
    };
    if (user) {
      key['project.userId'] = user.id;
    }
    return await this.storageModel.find(key);
  }

  async getByApplication(applicationId, user) {
    const key = {
      applicationId
    };
    if (user) {
      key['project.userId'] = user.id;
    }
    return await this.storageModel.find(key);
  }
}

module.exports = JobsModel;
