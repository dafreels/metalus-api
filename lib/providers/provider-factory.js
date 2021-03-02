const fs = require('fs');
const MetalusUtils = require('../metalus-utils');

class ProviderFactory {
  constructor() {
    this.providerList = [];
    this.providers = new Map();
    const providerFiles = fs.readdirSync(`${process.cwd()}/lib/providers`, {withFileTypes: true});
    let provider;
    let instance;
    providerFiles.forEach(f => {
      if (f.isDirectory()) {
        provider = require(`${process.cwd()}/lib/providers/${f.name}/index.js`);
        instance = new provider();
        this.providerList.push({
          id: instance.getId(),
          name: instance.getName()
        });
        this.providers.set(instance.getId(), provider);
      }
    });
  }

  getProviderList() {
    return MetalusUtils.clone(this.providerList);
  }

  getProvider(id) {
    const provider = this.providers.get(id);
    return new provider();
  }
}

module.exports = new ProviderFactory();
