const axios = require('axios');
const AWSProvider = require("../aws-provider");
const MetalusUtils = require('../../metalus-utils');
const newForm = require('./new-form.json');
const newClusterForm = require('./new-cluster-form.json');
const customJobForm = require('./custom-job-form.json');
const S3FS = require('../../fs/s3-fs');

class DatabricksProvider extends AWSProvider {
  constructor() {
    super('2c3cd05a-4345-459e-9a38-402840595153', 'Databricks', true);
  }

  secureCredentials(credentials, secretKey) {
    if (!credentials.apiToken || credentials.apiToken.trim().length === 0) {
      throw new Error('A valid API Token is required for this provider!');
    }
    credentials.apiToken = MetalusUtils.encryptString(credentials.apiToken,
      MetalusUtils.createSecretKeyFromString(secretKey));
    return super.secureCredentials(credentials, secretKey);
  }

  async getNewForm(user) {
    return JSON.stringify(newForm);
  }

  async getNewClusterForm(providerInstance, user) {
    return this.populateFormOptions(providerInstance, user,
      'spark_version', 'node_type_id',
      'driver_node_type_id', newClusterForm);
  }

  async getCustomJobForm(providerInstance, user) {
    return this.populateFormOptions(providerInstance, user,
      'new_cluster.spark_version', 'new_cluster.node_type_id',
      'new_cluster.driver_node_type_id', customJobForm);
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
        canStart: true,
        canStop: true,
        canDelete: true,
        canRunJob:  this.canRunJob(cluster)
      });
    });
    return clusterList;
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

  async createCluster(clusterConfig, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    try {
      const response = await client.post('/api/2.0/clusters/create', this.addRequiredAWSAttributes(clusterConfig));
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
      MetalusUtils.log(err);
      throw err;
    }
  }

  async getJob(providerInformation, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    const response = await client.get(`/api/2.0/jobs/runs/get?run_id=${providerInformation.runId}`);
    const job = response.data;
    const startTime = this.convertTimeStampToDate(job.start_time);
    const endTime = this.convertTimeStampToDate(job.end_time);
    return {
      status: this.convertStatus(job.state.life_cycle_state, job.state.result_state),
      startTime: startTime.getTime(),
      endTime: endTime.getTime(),
      executionDuration: endTime ? endTime.getTime() - startTime.getTime() : 0
    };
  }

  async cancelJob(providerInformation, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    return client.post('/api/2.0/jobs/runs/cancel', {run_id: providerInformation.runId});
  }

  async executeApplication(providerInstance, user, runConfig) {
    const client = this.generateClient(providerInstance, user.secretKey);
    // Upload jars to S3 bucket
    const s3fs = new S3FS(super.extractCredentials(providerInstance, user), {
      region: providerInstance.region,
      bucket: runConfig.bucket
    });
    await this.handleJarCopy(s3fs, runConfig);
    // Setup command
    let jobParameters = this.buildBasicJobParameters(runConfig);
    if (runConfig.useCredentialProvider) {
      jobParameters.push('--credential-provider');
      jobParameters.push('com.acxiom.aws.pipeline.AWSSecretsManagerCredentialProvider');
    }
    const config = {
      run_name: runConfig.name,
      existing_cluster_id: runConfig.clusterId,
      libraries: runConfig.jars.map(j => {
        return {jar: `s3://${runConfig.bucket}/${j}`};
      }),
      spark_jar_task: {
        main_class_name: runConfig.mainDriverClass,
        parameters: jobParameters
      }
    };
    if (runConfig.customFormValues && runConfig.customFormValues.useNewCluster) {
      delete config.existing_cluster_id;
      config.new_cluster = this.addRequiredAWSAttributes(runConfig.customFormValues.new_cluster);
    }
    try {
      const response = await client.post('/api/2.0/jobs/runs/submit', config);
      return `${response.data.run_id}`;
    } catch(err) {
      throw err;
    }
  }

  // Begin private functions

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
    return cluster.state === 'RUNNING';
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
    versionsConfig.templateOptions.options = versionList;

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

  addRequiredAWSAttributes(clusterConfig) {
    // TODO Check the config to see if we need to use spot nodes
    // TODO Check the node_type_id and driver_node_type_id to see if an ebs volume is required
    // TODO Maybe add ebs volume information to the forms and only show for certain types
    // clusterConfig.aws_attributes = {
    //   availability: 'SPOT_WITH_FALLBACK',
    //   ebs_volume_count: 1,
    //   ebs_volume_size: 500,
    //   ebs_volume_type: 'THROUGHPUT_OPTIMIZED_HDD'
    // };

    return clusterConfig;
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
