const schema = require('../schemas/package-objects.json');
const BaseModel = require('../lib/base.model');
const Promise = require('bluebird');


class PackageObjectsModel extends BaseModel {
    constructor() {
        super('package-objects', schema);
    }
    // custom model logic goes here
    validateJson(id, jsonObj) {
        return new Promise( (resolve, reject) => {
            return this.getByKey({id: id})
                .then((packageObject) => {
                    const objectValidator = this.getValidator(JSON.parse(packageObject.schema));
                    const validation = objectValidator(jsonObj);
                    if(!validation) {
                        resolve({ isValid: false, errors: objectValidator.errors });
                    } else {
                        resolve({ isValid: true });
                    }
                })
                .catch(err => {
                    reject(err);
                });
        });
    }
}

module.exports = PackageObjectsModel;
