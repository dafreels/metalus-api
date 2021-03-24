const axios = require('axios');
const BaseProvider = require("../base-provider");
const fs = require('fs');
const MetalusUtils = require('../../metalus-utils');
const newForm = require('./new-form.json');
const newClusterForm = require('./new-cluster-form.json');
const streamToPromise = require('stream-to-promise');

class DatabricksProvider extends BaseProvider {
  constructor() {
    super('2c3cd05a-4345-459e-9a38-402840595153', 'Databricks');
  }

  secureCredentials(credentials, secretKey) {
    if (!credentials.apiToken || credentials.apiToken.trim().length === 0) {
      throw new Error('A valid API Token is required for this provider!');
    }
    credentials.apiToken = MetalusUtils.encryptString(credentials.apiToken,
      MetalusUtils.createSecretKeyFromString(secretKey));
    return credentials;
  }

  async getNewForm(user) {
    return JSON.stringify(newForm);
  }

  async getNewClusterForm(user) {
    // TODO Get the nodeTypes so we can populate the select
    return JSON.stringify(newClusterForm);
  }

  convertFormDataToProvider(formData) {
    return {};
  }

  async getClusters(providerInstance, user) {
    // TODO Uncomment once account situation is resolved
    const clusters = this.generateClusterClient(providerInstance, user.secretKey);
    const response = await clusters.get(`/api/2.0/clusters/list`);
    const clusterList = [];
    response.clusters.map((cluster) => {
      return {
        id: cluster.cluster_id,
        name: cluster.cluster_name,
        version: cluster.spark_version,
        state: cluster.state,
        source: cluster.source,
        startTime: cluster.start_time,
        terminationTime: cluster.terminated_time
      };
    });
    return clusterList;
  }

  // TODO List available Spark Versions: https://<databricks-instance>/api/2.0/clusters/spark-versions
  async addCluster(clusterInfo, providerInstance, user) {
    const clusters = this.generateClusterClient(providerInstance, user.secretKey);
    // const response = await clusters.post(`/api/2.0/clusters/create`, clusterInfo);
  }

  generateClusterClient(providerInstance, secretKey) {
    const clusters = axios.create({
      baseUrl: providerInstance.instanceURL
    });

    const token = MetalusUtils.decryptString(providerInstance.credentials.apiToken,
      MetalusUtils.createSecretKeyFromString(secretKey));

    clusters.defaults.headers.common.Authorization = `Bearer ${token}`;
    return clusters;
  }

  async executeApplication(providerInstance, user, application,
                           clusterId, jarFiles, stagingDir, repos) {
    const token = MetalusUtils.decryptString(providerInstance.credentials.apiToken,
      MetalusUtils.createSecretKeyFromString(user.secretKey));
    const pathPrefix = `dbfs:/${user.id}/jars/`;
    const cp = await MetalusUtils.generateClasspath(jarFiles, stagingDir, pathPrefix, repos);
    const dbfsInstance = axios.create();
    dbfsInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    let fileList = await dbfsInstance.request({
      baseUrl: providerInstance.instanceURL,
      method: 'GET',
      data: { path: `/${user.id}/jars` }
    });
    if (fileList.files.length === 0) {
      fileList.files = [];
    }
    if (!fileList.files.find(f => f.path === `/${user.id}/jars`)) {
      await dbfsInstance.post(`/api/2.0/dbfs/mkdirs`, { path: `/${user.id}/jars` });
    }
    if (!fileList.files.find(f => f.path === `/${user.id}/${user.defaultProjectId}`)) {
      await dbfsInstance.post(`/api/2.0/dbfs/mkdirs`, { path: `/${user.id}/${user.defaultProjectId}` });
    }
    let readStream;
    let writeStream;
    // Upload the application
    // const applicationFileName = `/${user.id}/${user.defaultProjectId}/${application.id}.json`;
    // readStream = MetalusUtils.stringToStream(JSON.stringify(application));
    // writeStream = await dbfsInstance.post(`/api/2.0/dbfs/create`, { path: applicationFileName });
    // await MetalusUtils.pipeline(
    //   readStream,
    //   writeStream,
    // );
    const libraries = cp.split(',');
    let localJarFile;
    let jarName;
    let streamPromise;
    for await (let jarPath of libraries) {
      if (fileList.files.indexOf(jarPath) === -1) {
        MetalusUtils.log(`Uploading jar file ${jarPath} to DBFS /jars directory`);
        // Locate the full location in the jarFiles array to get the local path
        jarName = jarPath.replace(`${pathPrefix}/`, '');
        localJarFile = jarFiles.find(f => f.endsWith(jarName));
        readStream = fs.createReadStream(localJarFile);
        writeStream = await dbfsInstance.post(`/api/2.0/dbfs/create`, { path: `/${user.id}/jars/${jarName}` });
        streamPromise = streamToPromise(readStream.pipe(writeStream));
        readStream.resume();
        await streamPromise;
      }
    }
    const dbLibraries = libraries.map(l => {
      return { jar: l };
    });
    let metalusLib = libraries.find(l => l.replace(`${pathPrefix}/`, '').startsWith('metalus'));
    if (metalusLib) {
      metalusLib = metalusLib.replace(`${pathPrefix}/`, '');
      const index = metalusLib.lastIndexOf('-');
      const sparkIndex = metalusLib.indexOf('-spark_');
      const metalusVersion = metalusLib.substring(index + 1, metalusLib.indexOf('.jar'));
      const sparkVersion = metalusLib.substring(sparkIndex + 7, index);
      const scalaVersion = metalusLib.substring(metalusLib.indexOf('_') + 1, sparkIndex);
      dbLibraries.push(
        {
          maven: {
            coordinates: `com.acxiom:metalus-application_${scalaVersion}-spark_${sparkVersion}:${metalusVersion}`
          }
        });
    }
    const config = this.getRunConfig(name, dbLibraries, clusterId);
    const jobParameters = [];
    jobParameters.push('--driverSetupClass');
    jobParameters.push('com.acxiom.pipeline.applications.DefaultApplicationDriverSetup');
    // TODO Investigate stuffing the application in a jar and uploading
    jobParameters.push('--applicationJson');
    jobParameters.push(JSON.stringify(application));
    config.spark_jar_task.jar_params = jobParameters;
    const response = await dbfsInstance.post(`/api/2.0/runs/submit`, config);
    return response.run_id;
  }

  getRunConfig(name, libraries, clusterId) {
    // TODO This only works for batch jobs. Will need to capture batch or streaming (GCP, AWS, Kafka)
    return {
      run_name: name,
      existing_cluster_id: clusterId,
      libraries,
      spark_jar_task: {
        main_class_name: 'com.acxiom.pipeline.drivers.DefaultPipelineDriver',
        jar_params: []
      }
    };
  }
}

module.exports = DatabricksProvider;
