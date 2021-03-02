const BaseModel = require('../lib/base.model');
const schema = require('../schemas/providers.json');

class ProvidersModel extends BaseModel {
  constructor() {
    super('providers', schema, true);
  }
}

module.exports = ProvidersModel;
