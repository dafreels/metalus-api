const axios = require('axios');
const BaseProvider = require('../base-provider');
const { EC2 } = require('@aws-sdk/client-ec2');
const fs = require('fs');
const MetalusUtils = require('../../metalus-utils');
const { S3 } = require("@aws-sdk/client-s3");
const newForm = require('./new-form.json');
const newClusterForm = require('./new-cluster-form.json');
const createClusterConfig = require('./create_cluster_template.json');
const SparkSubmitOptions = require('./submit_spark.json');
const _ = require('lodash');

class QuboleAWS extends BaseProvider {
  constructor() {
    super('d4087e96-27de-4763-8ca3-74a22bb06ca4', 'Qubole AWS', true);
  }

  secureCredentials(credentials, secretKey) {
    if (!credentials.authToken || credentials.authToken.trim().length === 0) {
      throw new Error('A valid Auth Token is required for this provider!');
    }
    credentials.authToken = MetalusUtils.encryptString(credentials.authToken,
      MetalusUtils.createSecretKeyFromString(secretKey));

    if (!credentials.awsKey || credentials.awsKey.trim().length === 0) {
      throw new Error('A valid AWS API Key is required for this provider!');
    }
    credentials.awsKey = MetalusUtils.encryptString(credentials.awsKey,
      MetalusUtils.createSecretKeyFromString(secretKey));

    if (!credentials.awsSecret || credentials.awsSecret.trim().length === 0) {
      throw new Error('A valid AWS API Secret is required for this provider!');
    }
    credentials.awsSecret = MetalusUtils.encryptString(credentials.awsSecret,
      MetalusUtils.createSecretKeyFromString(secretKey));

    return credentials;
  }

  async getNewForm(user) {
    return JSON.stringify(newForm);
  }

  async getNewClusterForm(providerInstance, user) {
    const client = new EC2({
      region: providerInstance.region,
      credentials: this.extractCredentials(providerInstance, user)
    });
    const vpcs = await client.describeVpcs({});
    if (vpcs.Vpcs) {
      const vpcList = [];
      vpcs.Vpcs.forEach((vpc) => {
        vpcList.push({
          id: vpc.VpcId,
          name: vpc.VpcId
        });
      });
      const vpcConfig = newClusterForm.find(obj => obj.key === 'cloud_config.network_config.vpc_id');
      vpcConfig.templateOptions.options = vpcList;
    }

    const subnets = await client.describeSubnets({});
    if (subnets.Subnets) {
      const subnetList = [];
      subnets.Subnets.forEach((subnet) => {
        subnetList.push({
          id: subnet.SubnetId,
          name: `${subnet.MapPublicIpOnLaunch ? 'Public' : 'Private'} ${subnet.SubnetId} (${subnet.VpcId})`
        });
      });
      const subnetConfig = newClusterForm.find(obj => obj.key === 'cloud_config.network_config.subnet_id');
      subnetConfig.templateOptions.options = subnetList;
    }

    const instanceTypes = await client.describeInstanceTypeOfferings({
      LocationType: 'region',
      Filters: [
        {
          Name: 'location',
          Values: [providerInstance.region]
        },
        {
          Name: 'instance-type',
          Values: ['m5*', 'r3*', 'r5*.*xlarge']
        }]
    });
    if (instanceTypes && instanceTypes.InstanceTypeOfferings && instanceTypes.InstanceTypeOfferings.length > 0) {
      const typeList = [];
      instanceTypes.InstanceTypeOfferings.sort((a, b) => {
        return a.InstanceType.localeCompare(b.InstanceType);
      }).forEach(t => {
        typeList.push({
          id: t.InstanceType,
          name: t.InstanceType
        });
      });
      const masterConfig = newClusterForm.find(obj => obj.key === 'cluster_info.master_instance_type');
      masterConfig.templateOptions.options = typeList;
      const workerConfig = newClusterForm.find(obj => obj.key === 'cluster_info.slave_instance_type');
      workerConfig.templateOptions.options = typeList;
    }
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
          canDelete: true
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
        source: 'API',
        startTime: null,
        terminationTime: null,
        canStart: true,
        canStop: true,
        canDelete: true
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
    const s3Client = new S3({
      region: providerInstance.region,
      credentials: this.extractCredentials(providerInstance, user)
    });
    const fileResponse = await s3Client.listObjectsV2({
      Bucket: runConfig.bucket,
      Delimiter: '/',
      Prefix: 'jars/'
    });
    const fileList = fileResponse.Contents || [];
    const fileNames = fileList.filter(f => !f.Key.endsWith('/')).map(file => file.Key.substring(file.Key.lastIndexOf('/') + 1));
    for await (let jar of runConfig.jars) {
      if (runConfig.forceCopy || jar.indexOf('application_json') > -1 || fileNames.indexOf(jar) === -1) {
        if (fileNames.indexOf(jar) !== -1) {
          await s3Client.deleteObject({
            Key: jar,
            Bucket: runConfig.bucket
          });
        }
        await s3Client.putObject({
          Body: fs.createReadStream(`${runConfig.stagingDir}/${jar.substring(jar.indexOf('/') + 1)}`),
          Key: jar,
          Bucket: runConfig.bucket
        });
      }
    }
    const baseCommand =  `${SparkSubmitOptions.command} --class ${runConfig.mainDriverClass} --master ${SparkSubmitOptions.master}`;
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

  extractCredentials(providerInstance, user) {
    return {
      accessKeyId: MetalusUtils.decryptString(providerInstance.credentials.awsKey,
        MetalusUtils.createSecretKeyFromString(user.secretKey)),
      secretAccessKey: MetalusUtils.decryptString(providerInstance.credentials.awsSecret,
        MetalusUtils.createSecretKeyFromString(user.secretKey))
    };
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
