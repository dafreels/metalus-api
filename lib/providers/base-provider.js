class BaseProvider {
  constructor(id, name) {
    this.name = name;
    this.id = id;
  }

  getName() {
    return this.name;
  }

  getId() {
    return this.id;
  }

  secureCredentials(credentials) {
    throw new Error('Function (secureCredentials) not implemented!');
  }

  async getNewForm(user) {
    throw new Error('Function (getNewForm) not implemented!');
  }

  async getNewClusterForm(user) {
    throw new Error('Function (getNewClusterForm) not implemented!');
  }

  convertFormDataToProvider(formData) {
    throw new Error('Function (convertFormDataToProvider) not implemented!');
  }

  async getClusters(providerInstance, user) {
    throw new Error('Function (getClusters) not implemented!');
  }

  async createCluster(clusterConfig, providerInstance, user) {
    throw new Error('Function (createCluster) not implemented!');
  }

  async executeApplication(providerInstance, user, application,
                           clusterId, jarFiles, stagingDir, repos) {
    throw new Error('Function (generateClasspath) not implemented!');
  }
}

module.exports = BaseProvider;
