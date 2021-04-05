const AwsProvider = require("../aws-provider");
const { EMR } = require("@aws-sdk/client-emr");
const EMR_CONFIG = require('./emr-config.json');
const MetalusUtils = require('../../metalus-utils');
const newForm = require('./new-form.json');
const newClusterForm = require('./new-cluster-form.json');
const S3FS = require('../../fs/s3-fs');

class AwsEmrProvider extends AwsProvider {
  constructor() {
    super('76b77359-607e-4f37-bccc-76a650e6d48a', 'AWS EMR', true);
  }

  async getNewForm(user) {
    return JSON.stringify(newForm);
  }

  async getNewClusterForm(providerInstance, user) {
    // const client = this.generateClient(providerInstance, user);
    const form = MetalusUtils.clone(newClusterForm);
    // Load the releases
    Object.keys(EMR_CONFIG).forEach(key => {
      form[1].templateOptions.options.push(
        {
          id: key,
          name: key
        }
      );
    });
    const subnetList = await super.getSubnets(providerInstance, user);
    const subnetConfig = newClusterForm.find(obj => obj.key === 'Instances.Ec2SubnetId');
    subnetConfig.templateOptions.options = subnetList;
    const typeList = await super.getEC2InstanceTypes(providerInstance, user);
    const masterConfig = form.find(obj => obj.key === 'Instances.MasterInstanceType');
    masterConfig.templateOptions.options = typeList;
    const workerConfig = form.find(obj => obj.key === 'Instances.SlaveInstanceType');
    workerConfig.templateOptions.options = typeList;
    return JSON.stringify(form);
  }

  async getClusters(providerInstance, user) {
    const client = this.generateClient(providerInstance, user);
    const response = await client.listClusters({});
    const clusterList = [];
    if (response.Clusters && response.Clusters.length > 0) {
      let clusterInfo;
      for await (let cluster of response.Clusters) {
        clusterInfo = await client.describeCluster({
          ClusterId: cluster.Id
        });
        const runState = cluster.Status.State === 'WAITING' || cluster.Status.State === 'RUNNING';
        clusterList.push({
          id: cluster.Id,
          name: cluster.Name ? cluster.Name : '',
          version: clusterInfo.Cluster ? clusterInfo.Cluster.ReleaseLabel : '',
          state: cluster.Status.State,
          startTime: cluster.Status.Timeline.ReadyDateTime ? cluster.Status.Timeline.ReadyDateTime.getTime() : null,
          terminationTime: cluster.Status.Timeline.EndDateTime ? cluster.Status.Timeline.EndDateTime.getTime() : null,
          canStart: false,
          canStop: false,
          canDelete: !clusterInfo.Cluster.TerminationProtected && runState,
          canRunJob: runState
        });
      }
    }
    return clusterList;
  }

  async createCluster(clusterConfig, providerInstance, user) {
    const client = this.generateClient(providerInstance, user);

    clusterConfig.Instances.TerminationProtected = false;
    clusterConfig.Instances.KeepJobFlowAliveWhenNoSteps = true;
    clusterConfig.ServiceRole = 'EMR_DefaultRole';
    clusterConfig.JobFlowRole = 'EMR_EC2_DefaultRole';
    clusterConfig.VisibleToAllUsers = true;
    clusterConfig.Applications = [
      {
        Name: 'Spark'
      },
      {
        Name: 'Hadoop'
      }
    ];
    if (clusterConfig.LogUri && clusterConfig.LogUri.trim().length === 0) {
      delete clusterConfig.LogUri;
    }
    const response = await client.runJobFlow(clusterConfig);
    const clusterInfo = await client.describeCluster({
      ClusterId: response.JobFlowId
    });
    return {
      id: response.JobFlowId,
      name: clusterConfig.name,
      version: clusterInfo.Cluster ? clusterInfo.Cluster.ReleaseLabel : '',
      state: clusterInfo.Cluster.Status.State,
      startTime: clusterInfo.Cluster.Status.Timeline.ReadyDateTime ? clusterInfo.Cluster.Status.Timeline.ReadyDateTime.getTime() : null,
      terminationTime: clusterInfo.Cluster.Status.Timeline.EndDateTime ? clusterInfo.Cluster.Status.Timeline.EndDateTime.getTime() : null,
      canStart: false,
      canStop: false,
      canDelete: true
    };
  }

  async deleteCluster(clusterId, clusterName, providerInstance, user) {
    const client = this.generateClient(providerInstance, user);
    return client.terminateJobFlows({
      JobFlowIds: [clusterId]
    });
  }

  async getJob(providerInformation, providerInstance, user) {
    const client = this.generateClient(providerInstance, user);
    const response = await client.listSteps({
      ClusterId: providerInformation.clusterId,
      StepIds: [providerInformation.runId]
    });

    let startDate;
    let endDate;
    if (response.Steps[0].Status.Timeline) {
      if (response.Steps[0].Status.Timeline.StartDateTime) {
        startDate = response.Steps[0].Status.Timeline.StartDateTime;
      }
      if (response.Steps[0].Status.Timeline.EndDateTime) {
        endDate = response.Steps[0].Status.Timeline.EndDateTime;
      }
    }

    return {
      status: this.convertStatus(response.Steps[0].Status.State),
      startTime: startDate ? startDate.getTime() : null,
      endTime: endDate ? endDate.getTime() : null,
      executionDuration: endDate && startDate ? endDate.getTime() - startDate.getTime() : 0
    };
  }

  async cancelJob(providerInformation, providerInstance, user) {
    const client = this.generateClient(providerInstance, user);
    return client.cancelSteps({
      ClusterId: providerInformation.clusterId,
      StepIds: [providerInformation.runId]
    });
  }

  async executeApplication(providerInstance, user, runConfig) {
    const client = this.generateClient(providerInstance, user);
    const s3fs = new S3FS(super.extractCredentials(providerInstance, user), {
      region: providerInstance.region,
      credentials: super.extractCredentials(providerInstance, user),
      bucket: runConfig.bucket
    });
    await this.handleJarCopy(s3fs, runConfig);
    let parameters = ['spark-submit', '--class', runConfig.mainDriverClass, '--master', 'yarn'];
    parameters.push('--conf');
    parameters.push('spark.driver.userClassPathFirst=true');
    parameters.push('--conf');
    parameters.push('spark.executor.userClassPathFirst=true');
    // Strip out metalus-application and place it on the command line
    const metalusApplicationIndex = runConfig.jars.findIndex(j => j.indexOf('metalus-application') !== -1);
    const metalusApplication = runConfig.jars[metalusApplicationIndex];
    runConfig.jars.splice(metalusApplicationIndex, 1);
    const jars = runConfig.jars.map(j => `s3a://${runConfig.bucket}/${j}`);
    parameters.push('--jars');
    parameters.push(jars.join(','));
    parameters.push(`s3a://${runConfig.bucket}/${metalusApplication}`);
    if (runConfig.useCredentialProvider) {
      parameters.push('--credential-provider');
      parameters.push('com.acxiom.aws.pipeline.AWSSecretsManagerCredentialProvider');
    }
    parameters = parameters.concat(this.buildBasicJobParameters(runConfig));
    const params = {
      JobFlowId: runConfig.clusterId,
      ResourceId: runConfig.clusterId,
      Steps: [
        {
          HadoopJarStep: {
            Jar: 'command-runner.jar',
            Args: parameters
          },
          Name: runConfig.name,
          ActionOnFailure: 'CONTINUE'
        }
      ]
    };
    const response = await client.addJobFlowSteps(params);
    return response.StepIds[0];
  }

  // Begin private functions

  generateClient(providerInstance, user) {
    return new EMR({
      credentials: super.extractCredentials(providerInstance, user),
      region: providerInstance.region
    });
  }

  convertStatus(status) {
    switch(status) {
      case 'COMPLETED':
        return 'COMPLETE';
      case 'PENDING':
        return 'PENDING';
      case 'CANCELLED':
      case 'CANCEL_PENDING':
        return 'CANCELLED';
      case 'FAILED':
        return 'FAILED';
      case 'RUNNING':
      default:
        return 'RUNNING';
    }
  }
}

module.exports = AwsEmrProvider;
