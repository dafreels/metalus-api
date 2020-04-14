const schema = require('../schemas/users.json');
const BaseModel = require('../lib/base.model');

class UsersModel extends BaseModel {
  constructor() {
    super('users', schema);
  }
  // custom model logic goes here
  async getUser(id) {
    return await new UsersModel().getByKey({ id: id });
  }
}

module.exports = UsersModel;
