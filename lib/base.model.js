const Ajv = require('ajv');
const uuid = require('uuid/v1');
const Promise = require('bluebird');

let storageParameters;

class BaseModel {
    constructor(name, schema) {
        this.storageModel = this.getStorageModel(name);
        this.validator = this.getValidator(schema);
    }

    static initialStorageParameters(params) {
        storageParameters = params;
    }

    getValidator(schema) {
        const ajv = new Ajv({ allErrors: true });
        return ajv.compile(schema);
    }

    getStorageModel(collectionName) {
        const Model = require(`./${storageParameters.get('storageType')}-storage-model`);
        return new Model(collectionName, storageParameters);
    }

    getAll() {
        return this.storageModel.find({});
    }

    createOne(record) {
        return new Promise( (resolve, reject) => {
            // assign uuid id when missing
            if(!record.id) {
                record.id = uuid();
            }

            // validate record
            const validation = this.validator(record);
            if(!validation){
                reject(this.validator.errors);
            } else {
                resolve(this.storageModel.addRecord({ id: record.id }, record));
            }
        });
    }

    createMany(records) {
        return new Promise( (resolve) => {
            let errorList = [];
            let successList = [];
            // TODO: use bluebird each
            Promise.each(records, record => {
                return this.createOne(record)
                    .then(results => {
                        successList.push(results);
                    })
                    .catch(err => {
                        errorList.push({ error: err, record: record });
                    });
            })
                .then(() => {
                    resolve({ errorList: errorList, successList: successList });
                });
        });
    }

    getByKey(key) {
        return new Promise( (resolve, reject) => {
            this.storageModel.find(key)
                .then(records => {
                    if(records.length > 1) {
                        reject({message: 'more than one record found for this key!', records: records});
                    }
                    else if(records.length === 1){
                        resolve(records[0]);
                    }
                    else {
                        reject({ message: 'no records found!'});
                    }
                })
                .catch(err => { reject(err); });
        });
    }

    update(id, record) {
        return new Promise( (resolve, reject) => {
            const validation = this.validator(record);
            if(!validation){
                reject(this.validator.errors);
            } else if(id !== record.id) {
                reject(`update failed: id from object(${record.id}) does not match id from url(${id})`);
            } else {
                resolve(this.storageModel.updateRecord({ id: id }, record));
            }
        });
    }

    delete(id) {
        return new Promise( (resolve, reject) => {
            const key = { id: id };
            this.storageModel.find(key)
                .then(records => {
                    if(records.length > 0) {
                        this.storageModel.deleteRecord(key);
                        resolve(`id ${id} successfully deleted!`);
                    } else {
                        reject(`no records found for id ${id}`);
                    }
                });

        });
    }
}

module.exports = BaseModel;
