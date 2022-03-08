const BaseModel = require('../lib/base.model');
const schema = require('../schemas/run-profiles.json');

class RunProfilesModel extends BaseModel {
  constructor() {
    super('runProfiles', schema, false);
  }

  async getByApplication(applicationId, user) {
    const key = {
      applicationId
    };
    if (user) {
      key['project.userId'] = user.id;
    }
    return this.storageModel.find(key);
  }
}

module.exports = RunProfilesModel;
