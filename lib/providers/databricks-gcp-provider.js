const DatabricksProvider = require("./databricks-provider");
const MetalusUtils = require("../metalus-utils");

class DatabricksGcpProvider extends DatabricksProvider {
  constructor(id, name, enabled = false) {
    super(id, name, enabled);
  }

  secureCredentials(credentials, secretKey) {
    if (!credentials.jsonKey || credentials.jsonKey.trim().length === 0) {
      throw new Error('A valid JSON Key is required for this provider!');
    }
    credentials.jsonKey = MetalusUtils.encryptString(credentials.jsonKey,
      MetalusUtils.createSecretKeyFromString(secretKey));
    return super.secureCredentials(credentials, secretKey);
  }

  extractCredentials(providerInstance, user) {
    const credentials = MetalusUtils.decryptString(providerInstance.credentials.jsonKey,
      MetalusUtils.createSecretKeyFromString(user.secretKey));
    return JSON.parse(credentials);
  }
}

module.exports = DatabricksGcpProvider;
