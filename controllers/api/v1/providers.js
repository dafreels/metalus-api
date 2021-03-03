const BaseRoutes = require('../../../lib/base.routes');
const ProviderFactory = require('../../../lib/providers/provider-factory');
const ApplicationsModel = require('../../../models/applications.model');
const JobsModel = require('../../../models/jobs.model');
const PipelinesModel = require('../../../models/pipelines.model');
const ProvidersModel = require('../../../models/providers.model');
const ValidationError = require('../../../lib/ValidationError');
const MetalusUtils = require('../../../lib/metalus-utils');

const mavenCentral = `https://repo1.maven.org/maven2/com/acxiom`;

module.exports = function (router) {
  const baseRoutes = new BaseRoutes('provider', 'providers', ProvidersModel);
  baseRoutes.buildDeleteRoute(router);

  router.get('/', getProviders);
  router.post('/', createProvider);
  router.get('/:id', getProvider);
  router.get('/:id/clusters', getClusters);
  router.post('/:id/clusters', createCluster);
  router.delete('/:id/clusters/:clusterId', deleteCluster);
  router.get('/:id/new-cluster-form', getNewClusterForm);
  router.get('/:id/jobs', listJobs);
  router.post('/:id/jobs', startJob);
};

async function getNewClusterForm(req, res, next) {
  const user = await req.user;
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  if (provider) {
    try {
      const providerType = ProviderFactory.getProvider(provider.providerTypeId);
      const form = await providerType.getNewClusterForm(provider.providerInstance, user);
      res.status(200).json({form});
    } catch (err) {
      next(err)
    }
  } else {
    res.sendStatus(404);
  }
}

async function getProviders(req, res) {
  const user = await req.user;
  const providerTypes = ProviderFactory.getProviderList(user);
  const providersModel = new ProvidersModel();
  const providers = await providersModel.getAll(user);
  if (providers && providers.length > 0) {
    res.status(200).json({providers: providers.map(p => {
        delete p.providerInstance.credentials;
        p.providerName = providerTypes.find(t => t.id === p.providerTypeId).name;
        return p;
      })});
  } else {
    res.sendStatus(204);
  }
}

async function createProvider(req, res, next) {
  const user = await req.user;
  const providersModel = new ProvidersModel();
  const body = req.body;
  const provider = ProviderFactory.getProvider(body.providerTypeId);
  body.providerInstance.credentials = provider.secureCredentials(body.providerInstance.credentials, user.secretKey);
  try {
    const newProvider = await providersModel.createOne(body, user);
    delete newProvider.providerInstance.credentials;
    newProvider.providerName = provider.name;
    res.status(201).json(newProvider);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(422).json({errors: err.getValidationErrors(), body: req.body});
    } else {
      next(err);
    }
  }
}

async function getProvider(req, res) {
  const user = await req.user;
  const providerTypes = ProviderFactory.getProviderList(user);
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  if (provider) {
    delete provider.providerInstance.credentials;
    provider.providerName = providerTypes.find(t => t.id === provider.providerTypeId).name;
    res.status(200).json({provider});
  } else {
    res.sendStatus(404);
  }
}

async function getClusters(req, res, next) {
  const user = await req.user;
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  const providerType = ProviderFactory.getProvider(provider.providerTypeId);
  if (provider) {
    try {
      const clusters = await providerType.getClusters(provider.providerInstance, user);
      if (clusters && clusters.length === 0) {
        res.sendStatus(204);
      } else {
        res.status(200).json({
          clusters: clusters.map((c) => {
            c.providerName = provider.name;
            return c;
          })
        });
      }
    } catch(err) {
      next(err);
    }
  } else {
    res.sendStatus(404);
  }
}

async function createCluster(req, res, next) {
  const user = await req.user;
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  if (provider) {
    try {
      const providerType = ProviderFactory.getProvider(provider.providerTypeId);
      const cluster = await providerType.createCluster(req.body, provider.providerInstance, user);
      res.status(201).json({cluster});
    } catch (err) {
      next(err);
    }
  } else {
    res.sendStatus(404);
  }
}

async function deleteCluster(req, res, next) {
  const user = await req.user;
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  if (provider) {
    try {
      const providerType = ProviderFactory.getProvider(provider.providerTypeId);
      await providerType.deleteCluster(req.params.clusterId, req.query.clusterName, provider.providerInstance, user);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  } else {
    res.sendStatus(404);
  }
}

async function listJobs(req, res) {
  const user = await req.user;
  const jobsModel = new JobsModel();
  const jobs = await jobsModel.getByProvider(req.params.id, user);
  // TODO This will need to be refreshed and possibly not stored
  // state: '',
  //   startTime: '',
  //   endTime: ''
  // const providerTypes = ProviderFactory.getProviderList();
  // const providersModel = new ProvidersModel();
  // const providers = await providersModel.getAll(user);
  if (jobs && jobs.length > 0) {
    res.status(200).json({jobs});
  } else {
    res.sendStatus(204);
  }
}

async function startJob(req, res, next) {
  const user = await req.user;
  const name = req.body.name;
  const clusterId = req.body.clusterId;
  const clusterName = req.body.clusterName;
  const applicationId = req.body.applicationId;
  const bucket = req.body.bucket;
  const jobType = req.body.jobType;
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  if (provider) {
    const application = await new ApplicationsModel().getByKey({ id: applicationId }, user);
    const pipelinesModel = new PipelinesModel();
    let jarTags = await extractJarTags(application, pipelinesModel, user);
    const jarsDir = `${MetalusUtils.getProjectJarsBaseDir(req)}/${user.id}/${user.defaultProjectId}`;
    let processJSON = {
      jarFiles: [],
      repos: '',
      remoteJars: []
    };
    try {
      const json = JSON.parse(await MetalusUtils.readfile(`${jarsDir}/processedJars.json`));
      processJSON.jarFiles = json.jarFiles || [];
      processJSON.repos = json.repos || '';
      processJSON.remoteJars = json.remoteJars || [];
    } catch (err) {
      // Do nothing since we are just trying to load a file that may not exist
    }
    // Combine the local and remote jars that were uploaded
    const jarFiles = processJSON.jarFiles.concat(processJSON.remoteJars);
    // Bundle the application JSON into a jar so that it can be retrieved on the classpath
    const runConfig = await bundleApplicationJson(`${jarsDir}/staging`, application, applicationId);
    jarFiles.push(runConfig.jars[0]);
    // TODO handle custom parameters for streaming jobs
    let requiredStepLibrary;
    switch(jobType) {
      case 'kinesis':
        runConfig.mainDriverClass = 'com.acxiom.aws.drivers.KinesisPipelineDriver';
        requiredStepLibrary = 'metalus-aws';
        break;
      case 'kafka':
        runConfig.mainDriverClass = 'com.acxiom.kafka.drivers.KafkaPipelineDriver';
        requiredStepLibrary = 'metalus-kafka';
        break;
      case 'pubsub':
        runConfig.mainDriverClass = 'com.acxiom.gcp.drivers.PubSubPipelineDriver';
        requiredStepLibrary = 'metalus-gcp';
        break;
      default:
        runConfig.mainDriverClass = 'com.acxiom.pipeline.drivers.DefaultPipelineDriver';
    }
    // Iterate the jarTags and add anything that may be missing.
    // Metalus jars that aren't local will get the Maven remote location
    let versionInfo;
    jarTags.forEach((tag) => {
      if (jarFiles.findIndex(f => f.indexOf(tag) === -1) === -1 && tag.startsWith('metalus-')) {
        versionInfo = MetalusUtils.getMetalusVersionInfo(tag);
        jarFiles.push(`${mavenCentral}/${versionInfo.component}/${versionInfo.version}/${tag}`);
      }
    });
    const metalusTag = jarTags.find(t => t.startsWith('metalus-'));
    let metalusVersionInfo;
    if (metalusTag) {
      metalusVersionInfo = MetalusUtils.getMetalusVersionInfo(metalusTag);
    } else {
      metalusVersionInfo = await MetalusUtils.determineDefaultMetalusVersion();
    }
    // Find the metalus-application jar
    const jarName = `metalus-application_${metalusVersionInfo.scala}-spark_${metalusVersionInfo.spark}-${metalusVersionInfo.version}.jar`;
    let appJar = jarFiles.find(f => f.substring(f.lastIndexOf('/') + 1) === jarName);
    if (appJar) {
      runConfig.applicationJar = appJar;
    } else {
      runConfig.applicationJar = `${process.cwd()}/applicationJars/${jarName}`;
    }
    const stagingDir = `${jarsDir}/staging`;
    try {
      const providerType = ProviderFactory.getProvider(provider.providerTypeId);
      // Run the dependency resolver
      // When doing streaming, check for the presence of the proper metalus step library
      if (requiredStepLibrary) {
        const requiredJar = `${requiredStepLibrary}_${metalusVersionInfo.scala}-spark_${metalusVersionInfo.spark}-${metalusVersionInfo.version}.jar`;
        if (jarFiles.findIndex(f => f.indexOf(requiredJar) !== -1) === -1) {
          const localJar = processJSON.jarFiles.find(j => j.indexOf(requiredJar) !== -1);
          if (localJar) {
            jarFiles.push(localJar);
          } else {
            jarFiles.push(`${mavenCentral}/${requiredStepLibrary}_${metalusVersionInfo.scala}/spark_${metalusVersionInfo.spark}/${metalusVersionInfo.version}/${requiredJar}`);
          }
        }
      }
      const repos = processJSON.repos.trim().length > 0 ? `${jarsDir},${processJSON.repos.trim()}` : jarsDir;
      const classPath = await MetalusUtils.generateClasspath(jarFiles, stagingDir, 'jars/', repos);
      runConfig.jars = classPath.split(',');
      runConfig.bucket = bucket;
      runConfig.stagingDir = stagingDir;
      runConfig.clusterId = clusterId;
      runConfig.clusterName = clusterName;
      const runId = await providerType.executeApplication(provider.providerInstance, user, runConfig);

      const jobBody = {
        name,
        applicationId,
        applicationName: application.name,
        providerId: provider.id,
        projectId: user.defaultProjectId,
        jobType,
        providerInformation: {
          clusterId,
          clusterName,
          runId,
          bucket
        }
      };
      const jobsModel = new JobsModel();
      const job = await jobsModel.createOne(jobBody, user);
      res.status(201).json({job});
    } catch(err) {
      next(err);
    } finally {
      // Clean stagingDir
      MetalusUtils.removeDir(stagingDir);
    }
  } else {
    res.sendStatus(404);
  }
}

async function extractJarTags(application, pipelinesModel, user) {
  const pipelines = application.pipelines || [];
  let pipeline;
  for await (let exe of application.executions) {
    (exe.pipelines || []).forEach(p => pipelines.push(p));
    for await (let id of (exe.pipelineIds || [])) {
      pipeline = await pipelinesModel.getByKey({id}, user);
      pipelines.push(pipeline);
    }
  }
  let jarTags = [];
  pipelines.forEach(p => {
    p.steps.forEach(s => {
      if (s.tags && s.tags.filter(t => t.endsWith('.jar')).length > 0) {
        s.tags.forEach(t => {
          if (jarTags.indexOf(t) === -1) {
            jarTags.push(t);
          }
        });
      }
    });
  });
  return jarTags;
}

async function bundleApplicationJson(jarsDir, application, applicationId) {
  const appName = `application_json-${new Date().getTime()}.jar`;
  const directoryPath = `${jarsDir}/metadata/applications`
  await MetalusUtils.mkdir(directoryPath, {recursive: true});
  await MetalusUtils.writefile(`${directoryPath}/${application.id}.json`, Buffer.from(JSON.stringify(application)));
  const cwd = process.cwd();
  process.chdir(jarsDir);
  await MetalusUtils.exec('jar', ['cf', appName, 'metadata']);
  await MetalusUtils.removeDir(`${jarsDir}/metadata`);
  process.chdir(cwd);
  return {
    mainDriverClass: '',
    driverSetup: 'com.acxiom.pipeline.applications.DefaultApplicationDriverSetup',
    applicationJar: '',
    applicationId,
    jars: [
      `${jarsDir}/${appName}`
    ]
  };
}
