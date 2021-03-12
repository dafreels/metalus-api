const BaseProvider = require("../base-provider");
const Compute = require('@google-cloud/compute');
const dataproc = require('@google-cloud/dataproc');
const fs = require('fs');
const MetalusUtils = require('../../metalus-utils');
const newClusterForm = require('./new-cluster-form.json');
const newForm = require('./new-form.json');
const {Storage} = require('@google-cloud/storage');

class DataprocProvider extends BaseProvider {
  constructor() {
    super('23e3cb1b-3442-4832-a526-716bfc4c4a90', 'GCP Dataproc', true);
  }

  secureCredentials(credentials, secretKey) {
    if (!credentials.jsonKey || credentials.jsonKey.trim().length === 0) {
      throw new Error('A valid JSON Key is required for this provider!');
    }
    credentials.jsonKey = MetalusUtils.encryptString(credentials.jsonKey,
      MetalusUtils.createSecretKeyFromString(secretKey));
    return credentials;
  }

  async getNewForm(user) {
    return JSON.stringify(newForm);
  }

  async getNewClusterForm(providerInstance, user) {
    const credentials = MetalusUtils.decryptString(providerInstance.credentials.jsonKey,
      MetalusUtils.createSecretKeyFromString(user.secretKey));
    const compute = new Compute({
      projectId: providerInstance.projectId,
      credentials: JSON.parse(credentials)
    });
    // TODO Attempt to dynamically pull the list of standard dataproc images
    // const imagesResponse = await compute.getImages();
    const machineTypesResponse = await compute.getMachineTypes();
    const machineTypeList = [];
    machineTypesResponse[0].forEach((mtype) => {
        machineTypeList.push({
          id: mtype.id,
          name: mtype.name
        });
    });
    const masterConfig = newClusterForm.find(obj => obj.key === 'config.masterConfig.machineTypeUri');
    masterConfig.templateOptions.options = machineTypeList;
    const workerConfig = newClusterForm.find(obj => obj.key === 'config.workerConfig.machineTypeUri');
    workerConfig.templateOptions.options = machineTypeList;
    return JSON.stringify(newClusterForm);
  }

  async getClusters(providerInstance, user) {
    const clusterClient = this.generateClusterClient(providerInstance, user.secretKey).client;
    const response = await clusterClient.listClusters({
      region: providerInstance.region,
      projectId: providerInstance.projectId
    });
    const clusterList = [];
    if (response[0] && response[0].length > 0) {
      response[0].forEach((cluster) => {
        clusterList.push({
          id: cluster.clusterUuid,
          name: cluster.clusterName,
          version: cluster.config && cluster.config.softwareConfig ? cluster.config.softwareConfig.imageVersion : '',
          state: cluster.status.state,
          source: 'API',
          startTime: cluster.status.stateStartTime,
          terminationTime: null
        });
      });
    }
    return clusterList;
  }

  async createCluster(clusterConfig, providerInstance, user) {
    const clusterInfo = this.generateClusterClient(providerInstance, user.secretKey);
    const clusterClient = clusterInfo.client;
    clusterConfig.config.gceClusterConfig = {
      serviceAccountScopes: [
        'https://www.googleapis.com/auth/cloud-platform'
      ]
    };
    if (clusterConfig.useServiceAccount) {
      delete clusterConfig.useServiceAccount;
      clusterConfig.config.gceClusterConfig.serviceAccount = clusterInfo.key.client_email;
      clusterConfig.config.gceClusterConfig.serviceAccountScopes.push('https://www.googleapis.com/auth/bigquery');
      clusterConfig.config.gceClusterConfig.serviceAccountScopes.push('https://www.googleapis.com/auth/bigtable.admin.table');
      clusterConfig.config.gceClusterConfig.serviceAccountScopes.push('https://www.googleapis.com/auth/bigtable.data');
      clusterConfig.config.gceClusterConfig.serviceAccountScopes.push('https://www.googleapis.com/auth/cloud.useraccounts.readonly');
      clusterConfig.config.gceClusterConfig.serviceAccountScopes.push('https://www.googleapis.com/auth/devstorage.full_control');
      clusterConfig.config.gceClusterConfig.serviceAccountScopes.push('https://www.googleapis.com/auth/devstorage.read_write');
      clusterConfig.config.gceClusterConfig.serviceAccountScopes.push('https://www.googleapis.com/auth/logging.write');
    }
    // TODO Name must contain only lowercase letters, numbers, and hyphens
    clusterConfig.clusterName = clusterConfig.clusterName.toLowerCase();
    await clusterClient.createCluster({
      projectId: providerInstance.projectId,
      region: providerInstance.region,
      cluster: clusterConfig,
    });
    // This doesn't return until cluster has been provisioned. Need to send something back as a response and not wait
    return {
      id: '',
      name: clusterConfig.clusterName,
      version: clusterConfig.config && clusterConfig.config.softwareConfig ? clusterConfig.config.softwareConfig.imageVersion : '',
      state: 'Provisioning',
      source: 'API',
      startTime: new Date().getTime(),
      terminationTime: null
    };
  }

  async terminateCluster(clusterId, clusterName, providerInstance, user) {
    const clusterClient = this.generateClusterClient(providerInstance, user.secretKey).client;
    return clusterClient.deleteCluster({
      clusterUuid: clusterId,
      clusterName,
      region: providerInstance.region,
      projectId: providerInstance.projectId
    });
  }

  async getJob(providerInformation, providerInstance, user) {
    const jobClient = this.getJobClient(providerInstance, user);
    const response = await jobClient.getJob({
      projectId: providerInstance.projectId,
      region: providerInstance.region,
      jobId: providerInformation.runId
    });
    // TODO Should we introduce the other status such as PENDING and SETUP_DONE?
    let doneStatus;
    let endTimeStamp;
    if (response[0].status.state === 'DONE') {
      doneStatus = response[0].status;
      endTimeStamp = this.convertTimeStampToDate(doneStatus.stateStartTime);
    } else {
      doneStatus = response[0].statusHistory.find(s => s.state === 'DONE');
      if (doneStatus) {
        endTimeStamp = this.convertTimeStampToDate(doneStatus.stateStartTime);
      }
    }
    let runningStatus;
    let startTimeStamp;
    if (response[0].status.state === 'RUNNING') {
      runningStatus = response[0].status;
      startTimeStamp = this.convertTimeStampToDate(runningStatus.stateStartTime);
    } else {
      runningStatus = response[0].statusHistory.find(s => s.state === 'RUNNING');
      if (runningStatus) {
        startTimeStamp = this.convertTimeStampToDate(runningStatus.stateStartTime);
      }
    }
    return {
      status: response[0].status.state,
      startTime: runningStatus ? startTimeStamp.getTime() : null,
      endTime: doneStatus ? endTimeStamp.getTime() : null,
      executionDuration: runningStatus && doneStatus ? endTimeStamp.getTime() - startTimeStamp.getTime() : 0
    };
  }

  async cancelJob(providerInformation, providerInstance, user) {
    const jobClient = this.getJobClient(providerInstance, user);
    return jobClient.cancelJob({
      projectId: providerInstance.projectId,
      region: providerInstance.region,
      jobId: providerInformation.runId
    });
  }

  async executeApplication(providerInstance, user, runConfig) {
    const credentials = MetalusUtils.decryptString(providerInstance.credentials.jsonKey,
      MetalusUtils.createSecretKeyFromString(user.secretKey));
    const creds = JSON.parse(credentials);
    const storage = new Storage({
      scopes: 'https://www.googleapis.como/auth/cloud-platform',
      projectId: providerInstance.projectId,
      credentials: creds
    });
    const bucket = storage.bucket(runConfig.bucket);
    // Copy jars to GCS
    const [files] = await bucket.getFiles({
      autoPaginate: false,
      delimiter: '/',
      prefix: 'jars/'
    });
    const fileNames = files.map(file => file.name);
    for await (let jar of runConfig.jars) {
      if (jar.indexOf('application_json') > -1 || fileNames.indexOf(jar) === -1) {
        await this.copyFile(bucket, `${runConfig.stagingDir}/${jar.substring(jar.indexOf('/') + 1)}`, jar);
      }
    }

    const jobParameters = [];
    jobParameters.push('--driverSetupClass');
    jobParameters.push(runConfig.driverSetup);
    jobParameters.push('--applicationId');
    jobParameters.push(runConfig.applicationId);

    if (runConfig.logLevel && runConfig.logLevel.trim().length > 0) {
      jobParameters.push('--logLevel');
      jobParameters.push(runConfig.logLevel);
    }

    const jobClient = new dataproc.v1.JobControllerClient({
      apiEndpoint: `${providerInstance.region}-dataproc.googleapis.com`,
      projectId: providerInstance.projectId,
      credentials: creds
    });

    const job = {
      projectId: providerInstance.projectId,
      region: providerInstance.region,
      job: {
        placement: {
          clusterName: runConfig.clusterName
        },
        sparkJob: {
          mainClass: runConfig.mainDriverClass,
          jarFileUris: runConfig.jars.map(j => `gs://${runConfig.bucket}/${j}`),
          args: jobParameters
        }
      }
    };
    const [jobOperation] = await jobClient.submitJobAsOperation(job);
    return jobOperation.metadata.jobId;
  }

  // Begin private functions

  generateClusterClient(providerInstance, secretKey) {
    const credentials = MetalusUtils.decryptString(providerInstance.credentials.jsonKey,
      MetalusUtils.createSecretKeyFromString(secretKey));

    const creds = JSON.parse(credentials);
    return {
      client: new dataproc.v1.ClusterControllerClient({
        apiEndpoint: `${providerInstance.region}-dataproc.googleapis.com`,
        projectId: providerInstance.projectId,
        credentials: creds
      }),
      key: creds
    };
  }

  getJobClient(providerInstance, user) {
    const credentials = MetalusUtils.decryptString(providerInstance.credentials.jsonKey,
      MetalusUtils.createSecretKeyFromString(user.secretKey));
    return new dataproc.v1.JobControllerClient({
      apiEndpoint: `${providerInstance.region}-dataproc.googleapis.com`,
      projectId: providerInstance.projectId,
      credentials: JSON.parse(credentials)
    });
  }

  convertTimeStampToDate(timestamp) {
    const date = new Date(0);
    date.setUTCSeconds(parseInt(timestamp.seconds));
    date.setUTCMilliseconds(timestamp.nanos / 1000000);
    return date;
  }

  async copyFile(bucket, localFilePath, remoteFilePath) {
    const inputStream = fs.createReadStream(localFilePath);
    return new Promise((resolve, reject) => {
      const file = bucket.file(remoteFilePath);
      const writeStream = file.createWriteStream();
      inputStream.resume();
      inputStream.pipe(writeStream).on('open', (() => {
        inputStream.resume();
        inputStream.pipe(writeStream);
      }))
        .on('finish', (() => {
          writeStream.end();
          resolve();
        }))
        .on('error', ((err) => {
          reject(err);
        }))
    });
  }
}

module.exports = DataprocProvider;
