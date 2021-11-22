const MetalusUtils = require('../metalus-utils');
const DatabricksProvider = require('./databricks-provider');
const AWSProvider = require('./aws-provider');

class DatabricksAWSProvider extends DatabricksProvider {
  constructor(id, name, enabled = false) {
    super(id, name, enabled);
    this.awsProvider = new AWSProvider(id, name, enabled);
  }

  secureCredentials(credentials, secretKey) {
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
    return super.secureCredentials(credentials, secretKey);
  }

  extractCredentials(providerInstance, user) {
    return this.awsProvider.extractCredentials(providerInstance, user);
  }
}

module.exports = DatabricksAWSProvider;
