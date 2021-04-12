const axios = require('axios');
const AwsProvider = require('../aws-provider');
const MetalusUtils = require('../../metalus-utils');
const newForm = require('./new-form.json');
const newClusterForm = require('./new-cluster-form.json');
const createClusterConfig = require('./create_cluster_template.json');
const SparkSubmitOptions = require('./submit_spark.json');
const _ = require('lodash');
const S3FS = require('../../fs/s3-fs');

class QuboleAWS extends AwsProvider {
  constructor() {
    super('d4087e96-27de-4763-8ca3-74a22bb06ca4', 'Qubole AWS', true);
  }

  secureCredentials(credentials, secretKey) {
    if (!credentials.authToken || credentials.authToken.trim().length === 0) {
      throw new Error('A valid Auth Token is required for this provider!');
    }
    credentials.authToken = MetalusUtils.encryptString(credentials.authToken,
      MetalusUtils.createSecretKeyFromString(secretKey));

    return super.secureCredentials(credentials, secretKey);
  }

  getScopes(streaming) {
    return `sdk,s3,secretsmanager${streaming ? ',stream' : ''}`;
  }

  async getNewForm(user) {
    return JSON.stringify(newForm);
  }

  async getNewClusterForm(providerInstance, user) {
    const vpcList = await super.getVPCList(providerInstance, user);
    const vpcConfig = newClusterForm.find(obj => obj.key === 'cloud_config.network_config.vpc_id');
    vpcConfig.templateOptions.options = vpcList;

    const subnetList = await super.getSubnets(providerInstance, user);
    const subnetConfig = newClusterForm.find(obj => obj.key === 'cloud_config.network_config.subnet_id');
    subnetConfig.templateOptions.options = subnetList;

    const typeList = await super.getEC2InstanceTypes(providerInstance, user);
    const masterConfig = newClusterForm.find(obj => obj.key === 'cluster_info.master_instance_type');
    masterConfig.templateOptions.options = typeList;
    const workerConfig = newClusterForm.find(obj => obj.key === 'cluster_info.slave_instance_type');
    workerConfig.templateOptions.options = typeList;
    return JSON.stringify(newClusterForm);
  }

  async getClusters(providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    const response = await client.get('https://us.qubole.com/clusters/state.json');
    const clusterList = [];
    if (response.data && response.data.clusters && response.data.clusters.length > 0) {
      for await (let cluster of response.data.clusters) {
        let instance = {};
        if (!cluster.start_at) {
          try {
            const instanceResponse = await client.get(`https://us.qubole.com/api/v2.2/clusters/${cluster.id}/instances`);
            instance = instanceResponse.data.instances.pop();
          } catch (err) {
            // Not all clusters will return data
          }
        }

        clusterList.push({
          id: cluster.id,
          name: cluster.label ? cluster.label.join(',') : '',
          version: cluster.spark_version ? cluster.spark_version : '',
          state: cluster.state,
          startTime: cluster.start_at ? new Date(cluster.start_at).getTime() : instance.start_at ? new Date(instance.start_at).getTime() : null,
          terminationTime: cluster.start_at ? null : instance.down_at ? new Date(instance.down_at).getTime() : null,
          canStart: true,
          canStop: true,
          canDelete: true,
          canRunJob: true
        });
      }
    }
    return clusterList;
  }

  async createCluster(clusterConfig, providerInstance, user) {
    const configTemplate = _.merge(MetalusUtils.clone(createClusterConfig), clusterConfig);
    configTemplate.cloud_config.location.aws_region = providerInstance.region;
    configTemplate.cluster_info.label = configTemplate.labels.split(',');
    delete configTemplate.labels;
    configTemplate.cloud_config.location.aws_region = providerInstance.region;
    const client = this.generateClient(providerInstance, user.secretKey);
    // Streaming should change the flavour to spark-streaming?
    try {
      const response = await client.post('https://us.qubole.com/api/v2.2/clusters', configTemplate);
      return {
        id: response.data.id,
        name: response.data.cluster_info && response.data.cluster_info.label ? response.data.cluster_info.label.join(',') : null,
        version: response.data.engine_config && response.data.engine_config.spark_settings && response.data.engine_config.spark_settings.spark_version ? response.data.engine_config.spark_settings.spark_version : null,
        state: response.data.state,
        startTime: null,
        terminationTime: null,
        canStart: true,
        canStop: true,
        canDelete: true,
        canRunJob: true
      };
    } catch (err) {
      MetalusUtils.log(err);
      throw err;
    }
  }

  async startCluster(clusterId, clusterName, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    return client.put(`https://us.qubole.com/api/v2.2/clusters/${clusterId}/state`, { state : 'start' });
  }

  async stopCluster(clusterId, clusterName, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    return client.put(`https://us.qubole.com/api/v2.2/clusters/${clusterId}/state`, { state : 'terminate' });
  }

  async deleteCluster(clusterId, clusterName, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    return client.delete(`https://us.qubole.com/api/v2.2/clusters/${clusterId}`);
  }

  async getJob(providerInformation, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    const response = await client.get(`https://us.qubole.com/api/v1.2/commands/${providerInformation.runId}`);
    let startDate;
    let endDate;
    if (response.data.start_time) {
      startDate = new Date(0);
      startDate.setUTCSeconds(response.data.start_time);
    }
    if (response.data.end_time) {
      endDate = new Date(0);
      endDate.setUTCSeconds(response.data.end_time);
    }
    return {
      status: this.convertStatus(response.data.status),
      startTime: startDate ? startDate.getTime() : null,
      endTime: endDate ? endDate.getTime() : null,
      executionDuration: startDate && endDate ? endDate.getTime() - startDate.getTime() : 0
    };
  }

  async cancelJob(providerInformation, providerInstance, user) {
    const client = this.generateClient(providerInstance, user.secretKey);
    return client.put(`https://us.qubole.com/api/v1.2/commands/${providerInformation.runId}`,
      { status:'kill' });
  }

  async executeApplication(providerInstance, user, runConfig) {
    const client = this.generateClient(providerInstance, user.secretKey);
    const s3fs = new S3FS(super.extractCredentials(providerInstance, user), {
      region: providerInstance.region,
      credentials: super.extractCredentials(providerInstance, user),
      bucket: runConfig.bucket
    });
    await this.handleJarCopy(s3fs, runConfig);
    const baseCommand = `${SparkSubmitOptions.command} --class ${runConfig.mainDriverClass} --master ${SparkSubmitOptions.master}`;
    const confOptions = '--conf spark.driver.userClassPathFirst=true --conf spark.executor.userClassPathFirst=true';
    // Strip out metalus-application and place it on the command line
    const metalusApplicationIndex = runConfig.jars.findIndex(j => j.indexOf('metalus-application') !== -1);
    const metalusApplication = runConfig.jars[metalusApplicationIndex];
    runConfig.jars.splice(metalusApplicationIndex, 1);
    let jobParameters = this.buildBasicJobParameters(runConfig);
    if (runConfig.useCredentialProvider) {
      jobParameters.push('--credential-provider');
      jobParameters.push('com.acxiom.aws.pipeline.AWSSecretsManagerCredentialProvider');
    }
    const jars = runConfig.jars.map(j => `s3a://${runConfig.bucket}/${j}`);
    const submit = {
      cmdline: `${baseCommand} ${confOptions} --jars ${jars.join(',')} s3a://${runConfig.bucket}/${metalusApplication} ${jobParameters.join(' ')}`,
      language: SparkSubmitOptions.language,
      command_type: SparkSubmitOptions.command_type,
      label: runConfig.clusterName.split(',')[0],
      name: runConfig.name
    };
    const response = await client.post('https://us.qubole.com/api/v1.2/commands', submit);
    return response.data.id.toString();
  }

  // Begin private functions

  generateClient(providerInstance, secretKey) {
    const token = MetalusUtils.decryptString(providerInstance.credentials.authToken,
      MetalusUtils.createSecretKeyFromString(secretKey));

    const client = axios.create({
      headers: {
        'X-AUTH-TOKEN': token,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    return client;
  }

  convertStatus(status) {
    switch(status) {
      case 'done':
        return 'COMPLETE';
      case 'waiting':
        return 'PENDING';
      case 'cancelled':
        return 'CANCELLED';
      case 'error':
        return 'FAILED';
      case 'running':
      default:
        return 'RUNNING';
    }
  }
}

module.exports = QuboleAWS;
