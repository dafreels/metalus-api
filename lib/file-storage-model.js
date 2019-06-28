const Promise = require('bluebird');
const fs = require('fs');
const mingo = require('mingo');

class FileModel {
    constructor(name, params) {
        this.storageParameters = params;
        this.filepath = `./data/${name}.json`;

        this.fileExists(this.filepath)
            .then( (res) => {
                if(!res) { this.writeJSONFile([]); }
            });
    }

    getCollection() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.filepath, 'utf8', (error, data) => {
                if(error) reject(error);
                resolve(JSON.parse(data));
            });
        });
    }

    writeJSONFile(content) {
        fs.writeFileSync(this.filepath, JSON.stringify(content), 'utf8');
    }

    fileExists(filepath) {
        return new Promise((resolve) => {
            fs.stat(filepath, (err) => {
                if (err) resolve(false);
                resolve(true);
            });
        });
    }

    find(query) {
        return new Promise((resolve, reject) => {
            this.getCollection()
                .then(collection => {
                    resolve(mingo.find(collection, query).all());
                })
                .catch(err => {
                    reject(err);
                });

        });
    }

    addRecord(key, record) {
        return new Promise((resolve, reject) => {
            this.find(key)
                .then(results => {
                    if(results.length > 0) {
                        record.creationDate = results[0].creationDate || new Date();
                        return this.updateRecord(key, record);
                    }
                    else {
                        record.creationDate = new Date();
                        record.modifiedDate = new Date();
                        this.getCollection()
                            .then(collection => {
                                collection.push(record);
                                this.writeJSONFile(collection);
                                resolve(record);
                            })
                            .catch(err => reject(err));
                    }
                })
                .catch(err => reject(err));
        });
    }

    updateRecord(key, record) {
        return new Promise((resolve, reject) => {
            this.find(key)
                .then(stored => {
                    if(stored.length === 0){ resolve(this.addRecord(key, record)); }
                    else if(stored.length === 1){
                        this.deleteRecord(key)
                            .then(() => {
                                record.modifiedDate = new Date();
                                record.creationDate = stored.creationDate;
                                this.getCollection()
                                    .then(collection => {
                                        collection.push(record);
                                        this.writeJSONFile(collection);
                                        resolve(record);
                                    })
                                    .catch(err => reject(err));
                            })
                            .catch(err => reject(err));
                    } else { reject('multiple records found while attempting to update'); }
                })
                .catch(err => reject(err));
        });
    }

    deleteRecord(query) {
        return new Promise((resolve, reject) => {
            this.getCollection()
                .then(collection => {
                    collection = mingo.remove(collection, query);
                    this.writeJSONFile(collection);
                    resolve();
                })
                .catch(err => reject(err));
        });
    }
}

module.exports = FileModel;
