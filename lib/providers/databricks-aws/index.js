const DatabricksAWSProvider = require("../databricks-aws-provider");
const MetalusUtils = require('../../metalus-utils');
const newForm = require('./new-form.json');
const newClusterForm = require('./new-cluster-form.json');
const customJobForm = require('./custom-job-form.json');
const S3FS = require('../../fs/s3-fs');

class DatabricksProvider extends DatabricksAWSProvider {
  constructor() {
    super('2c3cd05a-4345-459e-9a38-402840595153', 'Databricks AWS', true);
    this.newForm = newForm;
    this.newClusterForm = newClusterForm;
    this.customJobForm = customJobForm;
  }

  getScopes(streaming) {
    return `s3a,secretsmanager${streaming ? ',stream' : ''}`;
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
      config.new_cluster = this.addRequiredParameters(runConfig.customFormValues.new_cluster);
    }
    // If the autoscale is a fixed amount, then use num_workers
    if (config.new_cluster && config.new_cluster.autoscale &&
      config.new_cluster.autoscale.min_workers === config.new_cluster.autoscale.max_workers) {
      config.new_cluster.num_workers = config.new_cluster.autoscale.min_workers;
      delete config.new_cluster.autoscale;
    }
    try {
      const response = await client.post('/api/2.0/jobs/runs/submit', config);
      return `${response.data.run_id}`;
    } catch(err) {
      MetalusUtils.log(err.response && err.response.data ? err.response.data.message : err);
      throw err;
    }
  }

  // Begin private functions

  addRequiredParameters(clusterConfig) {
    if (clusterConfig.aws_attributes && clusterConfig.aws_attributes.ebs_volume_count === 0) {
      delete clusterConfig.aws_attributes.ebs_volume_count;
      delete clusterConfig.aws_attributes.ebs_volume_type;
      delete clusterConfig.aws_attributes.ebs_volume_size;
    }
    // Always make the first node on demand so the driver doesn't get recycled
    clusterConfig.aws_attributes.first_on_demand = 1;

    return clusterConfig;
  }
}

module.exports = DatabricksProvider;
