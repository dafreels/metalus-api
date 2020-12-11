const Ajv = require('ajv');
const schema = require('../schemas/executions.json');
const BaseModel = require('../lib/base.model');

class ExecutionsModel extends BaseModel {
  constructor() {
    super('executions', schema);
  }

  // override getValidator to add dependent schemas
  getValidator(schema) {
    const ajv = new Ajv({ allErrors: true, extendRefs: true });
    return ajv
      .addSchema(require('../schemas/steps.json'))
      .addSchema(require('../schemas/pipelines.json'))
      .addSchema(require('../schemas/applications.json'))
      .compile(schema);
  }
}

module.exports = ExecutionsModel;
