const BaseProvider = require("./base-provider");
const { EC2 } = require('@aws-sdk/client-ec2');
const MetalusUtils = require('../metalus-utils');

class AwsProvider extends BaseProvider {
  constructor(id, name, enabled = false) {
    super(id, name, enabled);
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

    return credentials;
  }

  extractCredentials(providerInstance, user) {
    return {
      accessKeyId: MetalusUtils.decryptString(providerInstance.credentials.awsKey,
        MetalusUtils.createSecretKeyFromString(user.secretKey)),
      secretAccessKey: MetalusUtils.decryptString(providerInstance.credentials.awsSecret,
        MetalusUtils.createSecretKeyFromString(user.secretKey))
    };
  }

  async getEC2InstanceTypes(providerInstance, user) {
    const client = new EC2({
      region: providerInstance.region,
      credentials: this.extractCredentials(providerInstance, user)
    });
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
    const typeList = [];
    if (instanceTypes && instanceTypes.InstanceTypeOfferings && instanceTypes.InstanceTypeOfferings.length > 0) {
      instanceTypes.InstanceTypeOfferings.sort((a, b) => {
        return a.InstanceType.localeCompare(b.InstanceType);
      }).forEach(t => {
        typeList.push({
          id: t.InstanceType,
          name: t.InstanceType
        });
      });
    }

    return typeList;
  }

  async getVPCList(providerInstance, user) {
    const client = new EC2({
      region: providerInstance.region,
      credentials: this.extractCredentials(providerInstance, user)
    });
    const vpcList = [];
    const vpcs = await client.describeVpcs({});
    if (vpcs.Vpcs) {
      vpcs.Vpcs.forEach((vpc) => {
        vpcList.push({
          id: vpc.VpcId,
          name: vpc.VpcId
        });
      });
    }
    return vpcList;
  }

  async getSubnets(providerInstance, user) {
    const client = new EC2({
      region: providerInstance.region,
      credentials: this.extractCredentials(providerInstance, user)
    });
    const subnetList = [];
    const subnets = await client.describeSubnets({});
    if (subnets.Subnets) {
      subnets.Subnets.forEach((subnet) => {
        subnetList.push({
          id: subnet.SubnetId,
          name: `${subnet.MapPublicIpOnLaunch ? 'Public' : 'Private'} ${subnet.SubnetId} (${subnet.VpcId})`
        });
      });
    }

    return subnetList;
  }
}

module.exports = AwsProvider;
