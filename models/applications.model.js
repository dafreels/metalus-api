const Ajv = require('ajv');
const schema = require('../schemas/applications.json');
const BaseModel = require('../lib/base.model');


class ApplicationsModel extends BaseModel {
    constructor(){
        super('applications', schema);
    }

    // override getValidator to add dependent schemas
    getValidator(schema) {
        const ajv = new Ajv({ allErrors: true, extendRefs: true });
        return ajv
            .addSchema(require('../schemas/steps.json'))
            .addSchema(require('../schemas/pipelines.json'))
            .compile(schema);
    }


    // custom model logic goes here
}

module.exports = ApplicationsModel;
