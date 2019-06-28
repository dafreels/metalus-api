const schema = require('../schemas/steps.json');
const BaseModel = require('../lib/base.model');


class StepsModel extends BaseModel {
    constructor() {
        super('steps', schema);
    }
    // custom model logic goes here
}

module.exports = StepsModel;
