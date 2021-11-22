const BaseProvider = require("./base-provider");
const MetalusUtils = require("../metalus-utils");
const axios = require("axios");
const ValidationError = require("../ValidationError");

class DatabricksProvider extends BaseProvider {
  constructor(id, name, enabled = false) {
    super(id, name, enabled);
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
    return JSON.stringify(this.newForm);
  }

  async getNewClusterForm(providerInstance, user) {
    return this.populateFormOptions(providerInstance, user,
      'spark_version', 'node_type_id',
      'driver_node_type_id', this.newClusterForm);
  }

  async getCustomJobForm(providerInstance, user) {
    return this.populateFormOptions(providerInstance, user,
      'new_cluster.spark_version', 'new_cluster.node_type_id',
      'new_cluster.driver_node_type_id', this.customJobForm);
  }

  async getClusters(providerInstance, user) {
    const clusters = this.generateClient(providerInstance, user.secretKey);
    const response = await clusters.get(`/api/2.0/clusters/list`);
    const clusterList = [{
      id: 'run_cluster',
      name: 'CUSTOM JOB CLUSTER',
      version: 'RUNTIME',
      state: 'RUNNING',
      startTime: null,
      terminationTime: null,
      canStart: false,
      canStop: false,
      canDelete: false,
      canRunJob: true
    }];
    response.data.clusters.map((cluster) => {
      clusterList.push({
        id: cluster.cluster_id,
        name: cluster.cluster_name,
        version: cluster.spark_version,
        state: cluster.state,
        startTime: this.convertTimeStampToDate(cluster.start_time),
        terminationTime: this.convertTimeStampToDate(cluster.terminated_time),
        canStart: cluster.cluster_source !== 'JOB',
        canStop: cluster.cluster_source !== 'JOB',
        canDelete: true,
        canRunJob:  this.canRunJob(cluster)
      });
    });
    return clusterList;
  }

  async createCluster(clusterConfig, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    try {
      const response = await client.post('/api/2.0/clusters/create', this.addRequiredParameters(clusterConfig));
      const clusterId = response.data.cluster_id;
      const cluster = await client.get(`/api/2.0/clusters/get?cluster_id=${clusterId}`);
      return {
        id: cluster.data.cluster_id,
        name: cluster.data.cluster_name,
        version: cluster.data.spark_version,
        state: cluster.data.state,
        startTime: this.convertTimeStampToDate(cluster.data.start_time),
        terminationTime: this.convertTimeStampToDate(cluster.data.terminated_time),
        canStart: true,
        canStop: true,
        canDelete: true,
        canRunJob: this.canRunJob(cluster.data)
      };
    } catch(err) {
      if (err.response && err.response.data) {
        const msg = `Error Code: ${err.response.data.error_code}, Caused by: ${err.response.data.message}`;
        MetalusUtils.log(msg);
        throw new ValidationError(msg, [msg]);
      }
      MetalusUtils.log(err);
      throw err;
    }
  }

  async startCluster(clusterId, clusterName, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    return client.post('/api/2.0/clusters/start', { cluster_id : clusterId });
  }

  async stopCluster(clusterId, clusterName, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    return client.post('/api/2.0/clusters/delete', { cluster_id : clusterId });
  }

  async deleteCluster(clusterId, clusterName, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    return client.post('/api/2.0/clusters/permanent-delete', { cluster_id : clusterId });
  }

  async getJob(providerInformation, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    const response = await client.get(`/api/2.0/jobs/runs/get?run_id=${providerInformation.runId}`);
    const job = response.data;
    const startTime = this.convertTimeStampToDate(job.start_time);
    const endTime = this.convertTimeStampToDate(job.end_time);
    return {
      status: this.convertStatus(job.state.life_cycle_state, job.state.result_state),
      startTime: startTime? startTime.getTime() : null,
      endTime: endTime ? endTime.getTime() : null,
      executionDuration: endTime ? endTime.getTime() - startTime.getTime() : 0
    };
  }

  async cancelJob(providerInformation, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    return client.post('/api/2.0/jobs/runs/cancel', {run_id: providerInformation.runId});
  }

  // Begin private functions

  addRequiredParameters(clusterConfig) {
    return clusterConfig;
  }

  async populateFormOptions(providerInstance, user, sparkVersionKey, nodeTypeKey, driverTypeKey, form) {
    const client = this.generateClient(providerInstance, user.secretKey);
    const clusterForm = MetalusUtils.clone(form);
    const versionsResponse = await client.get('/api/2.0/clusters/spark-versions');
    const versionList = [];
    if (versionsResponse.data.versions) {
      versionsResponse.data.versions.sort((a, b) => {
        return a.key.localeCompare(b.key);
      }).forEach((version) => {
        versionList.push({
          key: version.key,
          name: version.name
        });
      });
    }
    const versionsConfig = clusterForm.find(obj => obj.key === sparkVersionKey);
    versionsConfig.templateOptions.options = versionList.reverse();

    const nodeTypeList = [];
    const nodesResponse = await client.get('/api/2.0/clusters/list-node-types');
    const nodesConfig = clusterForm.find(obj => obj.key === nodeTypeKey);
    if (nodesResponse.data.node_types) {
      nodesResponse.data.node_types.sort((a, b) => {
        return a.node_type_id.localeCompare(b.node_type_id);
      }).forEach((node) => {
        nodeTypeList.push({
          id: node.node_type_id,
          name: `${node.description}${node.is_deprecated ? ' (deprecated)' : ''}`
        });
      });
    }
    nodesConfig.templateOptions.options = nodeTypeList;
    const driverConfig = clusterForm.find(obj => obj.key === driverTypeKey);
    driverConfig.templateOptions.options = nodeTypeList;

    return JSON.stringify(clusterForm);
  }

  generateClient(providerInstance, secretKey) {
    const clusters = axios.create({
      baseURL: providerInstance.instanceURL
    });

    const token = MetalusUtils.decryptString(providerInstance.credentials.apiToken,
      MetalusUtils.createSecretKeyFromString(secretKey));

    clusters.defaults.headers.common.Authorization = `Bearer ${token}`;
    return clusters;
  }

  convertTimeStampToDate(timestamp) {
    if (!timestamp) {
      return null;
    }
    return new Date(timestamp);
  }

  canRunJob(cluster) {
    return cluster.state === 'RUNNING' && cluster.cluster_source !== 'JOB';
  }

  convertStatus(status, runState) {
    switch(status) {
      case 'TERMINATING':
      case 'TERMINATED':
      case 'INTERNAL_ERROR':
        if (runState === 'SUCCESS') {
          return 'COMPLETE';
        } else if (runState === 'CANCELED' || runState === 'TIMEDOUT') {
          return 'CANCELLED';
        } else if (runState === 'FAILED') {
          return 'FAILED';
        }
        return 'RUNNING';
      case 'PENDING':
        return 'PENDING';
      case 'SKIPPED':
        return 'FAILED';
      case 'RUNNING':
      default:
        return 'RUNNING';
    }
  }
}

module.exports = DatabricksProvider;
