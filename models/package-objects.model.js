const schema = require('../schemas/package-objects.json');
const BaseModel = require('../lib/base.model');


class PackageObjectsModel extends BaseModel {
    constructor() {
        super('package-objects', schema);
    }

    // custom model logic goes here
    async validateJson(id, jsonObj) {
        try {
            const packageObject = await this.getByKey({id: id});
            const objectValidator = this.getValidator(JSON.parse(packageObject.schema));
            const validation = objectValidator(jsonObj);
            if(!validation) {
                return { isValid: false, errors: objectValidator.errors };
            } else {
                return { isValid: true };
            }
        } catch(err) {
            throw err;
        }
    }
}

module.exports = PackageObjectsModel;
