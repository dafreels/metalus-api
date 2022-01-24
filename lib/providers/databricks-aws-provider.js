const MetalusUtils = require('../metalus-utils');
const DatabricksProvider = require('./databricks-provider');
const AWSProvider = require('./aws-provider');

class DatabricksAWSProvider extends DatabricksProvider {
  constructor(id, name, enabled = false) {
    super(id, name, enabled);
    this.awsProvider = new AWSProvider(id, name, enabled);
  }

  secureCredentials(credentials, secretKey) {
    if (!credentials.accessKeyId || credentials.accessKeyId.trim().length === 0) {
      throw new Error('A valid AWS API Key is required for this provider!');
    }
    credentials.accessKeyId = MetalusUtils.encryptString(credentials.accessKeyId,
      MetalusUtils.createSecretKeyFromString(secretKey));

    if (!credentials.secretAccessKey || credentials.secretAccessKey.trim().length === 0) {
      throw new Error('A valid AWS API Secret is required for this provider!');
    }
    credentials.secretAccessKey = MetalusUtils.encryptString(credentials.secretAccessKey,
      MetalusUtils.createSecretKeyFromString(secretKey));
    return super.secureCredentials(credentials, secretKey);
  }

  extractCredentials(providerInstance, user) {
    const credentials = this.awsProvider.extractCredentials(providerInstance, user);
    credentials.apiToken = MetalusUtils.decryptString(providerInstance.credentials.apiToken,
      MetalusUtils.createSecretKeyFromString(user.secretKey));
    return credentials;
  }
}

module.exports = DatabricksAWSProvider;
