const BaseProvider = require("../base-provider");
const Compute = require('@google-cloud/compute');
const dataproc = require('@google-cloud/dataproc');
const MetalusUtils = require('../../metalus-utils');
const newClusterForm = require('./new-cluster-form.json');
const newForm = require('./new-form.json');
const GCSFS = require('../../fs/gcs-fs');
const {JWT} = require('google-auth-library');

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
    const clusterForm = MetalusUtils.clone(newClusterForm);
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
    const masterConfig = clusterForm.find(obj => obj.key === 'config.masterConfig.machineTypeUri');
    masterConfig.templateOptions.options = machineTypeList;
    const workerConfig = clusterForm.find(obj => obj.key === 'config.workerConfig.machineTypeUri');
    workerConfig.templateOptions.options = machineTypeList;
    return JSON.stringify(clusterForm);
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
          state: cluster.status.state || 'STOPPED',
          startTime: this.convertTimeStampToDate(cluster.status.stateStartTime),
          terminationTime: null,
          canStart: true,
          canStop: true,
          canDelete: true,
          canRunJob: cluster.status.state === 'RUNNING'
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
    return {
      id: '',
      name: clusterConfig.clusterName,
      version: clusterConfig.config && clusterConfig.config.softwareConfig ? clusterConfig.config.softwareConfig.imageVersion : '',
      state: 'Provisioning',
      startTime: new Date().getTime(),
      terminationTime: null,
      canStart: false,
      canStop: false,
      canDelete: true
    };
  }

  async startCluster(clusterId, clusterName, providerInstance, user) {
    const client = this.getJWTClient(providerInstance, user);
    const url = `https://dataproc.googleapis.com/v1/projects/${providerInstance.projectId}/regions/${providerInstance.region}/clusters/${clusterName}:start`;
    return client.request({method: 'POST', url});
  }

  async stopCluster(clusterId, clusterName, providerInstance, user) {
    const client = this.getJWTClient(providerInstance, user);
    const url = `https://dataproc.googleapis.com/v1/projects/${providerInstance.projectId}/regions/${providerInstance.region}/clusters/${clusterName}:stop`;
    return client.request({method: 'POST', url});
  }

  async deleteCluster(clusterId, clusterName, providerInstance, user) {
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
      status: this.convertStatus(response[0].status.state),
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
    const gcsFs = new GCSFS(creds, {
      projectId: providerInstance.projectId,
      bucket: runConfig.bucket
    })
    // Copy jars to GCS
    await this.handleJarCopy(gcsFs, runConfig);
    let jobParameters = this.buildBasicJobParameters(runConfig);
    if (runConfig.useCredentialProvider) {
      jobParameters.push('--credential-provider');
      jobParameters.push('com.acxiom.gcp.pipeline.GCPSecretsManagerCredentialProvider');
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

  getJWTClient(providerInstance, user) {
    const credentials = JSON.parse(MetalusUtils.decryptString(providerInstance.credentials.jsonKey,
      MetalusUtils.createSecretKeyFromString(user.secretKey)));
    return new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  convertTimeStampToDate(timestamp) {
    if (!timestamp) {
      return null;
    }
    const date = new Date(0);
    date.setUTCSeconds(parseInt(timestamp.seconds));
    date.setUTCMilliseconds(timestamp.nanos / 1000000);
    return date;
  }

  convertStatus(status) {
    switch(status) {
      case 'DONE':
        return 'COMPLETE';
      case 'PENDING':
        return 'PENDING';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'ERROR':
      case 'ATTEMPT_FAILURE':
        return 'FAILED';
      case 'RUNNING':
      default:
        return 'RUNNING';
    }
  }
}

module.exports = DataprocProvider;
