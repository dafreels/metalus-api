const newForm = require("./new-form.json");
const newClusterForm = require("./new-cluster-form.json");
const DatabricksGcpProvider = require("../databricks-gcp-provider");
const customJobForm = require("./custom-job-form.json");
const MetalusUtils = require("../../metalus-utils");
const GCSFS = require("../../fs/gcs-fs");

class GCPDatabricksProvider extends DatabricksGcpProvider {
  constructor() {
    super('71116742-7805-47cb-a628-0505766a7019', 'Databricks GCP', true);
    this.newForm = newForm;
    this.newClusterForm = newClusterForm;
    this.customJobForm = customJobForm;
  }

  // getScopes(streaming) {
  //   return `secretsmanager${streaming ? ',stream' : ''}`;
  // }

  async executeApplication(providerInstance, user, runConfig) {
    const client = this.generateClient(providerInstance, user.secretKey);
    // Upload jars to GCS bucket
    const creds = super.extractCredentials(providerInstance, user);
    const gcsFs = new GCSFS(creds.jsonKey, {
      projectId: providerInstance.projectId,
      bucket: runConfig.bucket
    })
    await this.handleJarCopy(gcsFs, runConfig);
    // Setup command
    let jobParameters = this.buildBasicJobParameters(runConfig);
    if (runConfig.useCredentialProvider) {
      jobParameters.push('--credential-provider');
      jobParameters.push('com.acxiom.gcp.pipeline.GCPSecretsManagerCredentialProvider');
    }
    const config = {
      run_name: runConfig.name,
      existing_cluster_id: runConfig.clusterId,
      libraries: runConfig.jars.map(j => {
        return {jar: `gs://${runConfig.bucket}/${j}`};
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
}

module.exports = GCPDatabricksProvider;
