class BaseProvider {
  constructor(id, name, enabled = false) {
    this.name = name;
    this.id = id;
    this.enabled = enabled;
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

  getScopes(streaming) {
    return null;
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

  async getCustomJobForm(providerInstance, user) {
    return null;
  }

  async getClusters(providerInstance, user) {
    throw new Error('Function (getClusters) not implemented!');
  }

  async createCluster(clusterConfig, providerInstance, user) {
    throw new Error('Function (createCluster) not implemented!');
  }

  async startCluster(clusterId, clusterName, providerInstance, user) {
    throw new Error('Function (startCluster) not implemented!');
  }

  async stopCluster(clusterId, clusterName, providerInstance, user) {
    throw new Error('Function (stopCluster) not implemented!');
  }

  async deleteCluster(clusterId, clusterName, providerInstance, user) {
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

  buildBasicJobParameters(runConfig) {
    let jobParameters = [];
    jobParameters.push('--driverSetupClass');
    jobParameters.push(runConfig.driverSetup);
    jobParameters.push('--applicationId');
    jobParameters.push(runConfig.applicationId);

    if (runConfig.logLevel && runConfig.logLevel.trim().length > 0) {
      jobParameters.push('--logLevel');
      jobParameters.push(runConfig.logLevel);
    }

    if (runConfig.rootLogLevel && runConfig.rootLogLevel.trim().length > 0) {
      jobParameters.push('--rootLogLevel');
      jobParameters.push(runConfig.rootLogLevel);
    }

    if (runConfig.customLogLevels && runConfig.customLogLevels.trim().length > 0) {
      jobParameters.push('--customLogLevels');
      jobParameters.push(runConfig.customLogLevels);
    }

    if (runConfig.extraParameters && runConfig.extraParameters.length > 0) {
      jobParameters = jobParameters.concat(runConfig.extraParameters)
    }

    return jobParameters;
  }

  async handleJarCopy(fs, runConfig) {
    const fileNames = await fs.listFiles('jars/')
    for await (let jar of runConfig.jars) {
      if (runConfig.forceCopy || jar.indexOf('application_json') > -1 || fileNames.indexOf(jar) === -1) {
        await fs.copyFile(`${runConfig.stagingDir}/${jar.substring(jar.indexOf('/') + 1)}`,
          jar, runConfig.forceCopy);
      }
    }
  }
}

module.exports = BaseProvider;
