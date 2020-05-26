const schema = require('../schemas/users.json');
const BaseModel = require('../lib/base.model');
const _ = require('lodash');

class UsersModel extends BaseModel {
  constructor() {
    super('users', schema);
  }
  // custom model logic goes here
  async getUser(id) {
    return await new UsersModel().getByKey({ id: id });
  }

  async hasProjectId(id, projectId) {
    const user = await this.getUser(id);
    return _.filter(user.projects, (p) => {
      return p.id === projectId;
    }).length > 0;
  }
}

module.exports = UsersModel;
