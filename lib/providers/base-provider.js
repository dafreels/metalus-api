class BaseProvider {
  constructor(id, name, enabled = false, deleteJobs = true) {
    this.name = name;
    this.id = id;
    this.enabled = enabled;
    this.deleteJobs = deleteJobs;
  }

  getName() {
    return this.name;
  }

  getId() {
    return this.id;
  }

  isEnabled() {
    return this.enabled;
  }

  canDeleteJobs() {
    return this.deleteJobs();
  }

  secureCredentials(credentials, secretKey) {
    throw new Error('Function (secureCredentials) not implemented!');
  }

  async getNewForm(user) {
    throw new Error('Function (getNewForm) not implemented!');
  }

  async getNewClusterForm(providerInstance, user) {
    throw new Error('Function (getNewClusterForm) not implemented!');
  }

  async getClusters(providerInstance, user) {
    throw new Error('Function (getClusters) not implemented!');
  }

  async createCluster(clusterConfig, providerInstance, user) {
    throw new Error('Function (createCluster) not implemented!');
  }

  async terminateCluster(clusterId, clusterName, providerInstance, user) {
    throw new Error('Function (deleteCluster) not implemented!');
  }

  async getJob(providerInformation, providerInstance, user) {
    throw new Error('Function (getJob) not implemented!');
  }

  async cancelJob(providerInformation, providerInstance, user) {
    throw new Error('Function (cancelJob) not implemented!');
  }

  async executeApplication(providerInstance, user, runConfig) {
    throw new Error('Function (generateClasspath) not implemented!');
  }
}

module.exports = BaseProvider;
