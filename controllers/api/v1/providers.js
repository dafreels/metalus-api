const BaseRoutes = require('../../../lib/base.routes');
const ProviderFactory = require('../../../lib/providers/provider-factory');
const ApplicationsModel = require('../../../models/applications.model');
const JobsModel = require('../../../models/jobs.model');
const PipelinesModel = require('../../../models/pipelines.model');
const ProvidersModel = require('../../../models/providers.model');
const ValidationError = require('../../../lib/ValidationError');
const MetalusUtils = require('../../../lib/metalus-utils');
const _ = require('lodash');

const mavenCentral = `https://repo1.maven.org/maven2/com/acxiom`;

module.exports = function (router) {
  const baseRoutes = new BaseRoutes('provider', 'providers', ProvidersModel);
  baseRoutes.buildDeleteRoute(router);

  router.get('/', getProviders);
  router.post('/', createProvider);
  router.get('/:id', getProvider);
  router.delete('/:id', deleteProvider);
  router.get('/:id/clusters', getClusters);
  router.post('/:id/clusters', createCluster);
  router.put('/:id/clusters/:clusterId/start', startCluster);
  router.put('/:id/clusters/:clusterId/stop', stopCluster);
  router.delete('/:id/clusters/:clusterId', deleteCluster);
  router.get('/:id/new-cluster-form', getNewClusterForm);
  router.get('/:id/custom-job-form', getCustomJobForm);
  router.get('/:id/jobs', listJobs);
  router.post('/:id/jobs', startJob);
  router.get('/:id/jobs/:jobId', getJob);
  router.put('/:id/jobs/:jobId', cancelJob);
  router.delete('/:id/jobs/:jobId', deleteJob);
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

async function getCustomJobForm(req, res, next) {
  const user = await req.user;
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  if (provider) {
    try {
      const providerType = ProviderFactory.getProvider(provider.providerTypeId);
      const form = await providerType.getCustomJobForm(provider.providerInstance, user);
      res.status(200).json({form});
    } catch (err) {
      next(err)
    }
  } else {
    res.sendStatus(204);
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

async function deleteProvider(req, res) {
  const user = await req.user;
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  if (provider) {
    const jobsModel = new JobsModel();
    await providersModel.delete(req.params.id, user);
    await jobsModel.deleteMany({providerId: req.params.id});
    res.sendStatus(204);
  } else {
    res.sendStatus(404);
  }
}

async function getClusters(req, res, next) {
  const user = await req.user;
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  if (provider) {
    const providerType = ProviderFactory.getProvider(provider.providerTypeId);
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
      if (err instanceof ValidationError) {
        res.status(422).json({errors: err.getValidationErrors(), body: req.body});
      } else {
        next(err);
      }
    }
  } else {
    res.sendStatus(404);
  }
}

async function startCluster(req, res, next) {
  const user = await req.user;
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  if (provider) {
    try {
      const providerType = ProviderFactory.getProvider(provider.providerTypeId);
      await providerType.startCluster(req.params.clusterId, req.query.clusterName, provider.providerInstance, user);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  } else {
    res.sendStatus(404);
  }
}

async function stopCluster(req, res, next) {
  const user = await req.user;
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  if (provider) {
    try {
      const providerType = ProviderFactory.getProvider(provider.providerTypeId);
      await providerType.stopCluster(req.params.clusterId, req.query.clusterName, provider.providerInstance, user);
      res.sendStatus(204);
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
      // Delete the jobs associated with this cluster if terminate removes the cluster
      const jobsModel = new JobsModel();
      await jobsModel.deleteMany({'providerInformation.clusterId': req.params.clusterId});
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
  if (jobs && jobs.length > 0) {
    res.status(200).json({jobs: jobs.sort((a, b) => b.creationDate.getTime() - a.creationDate.getTime())});
  } else {
    res.sendStatus(204);
  }
}

async function getJob(req, res, next) {
  const user = await req.user;
  const jobsModel = new JobsModel();
  const job = await jobsModel.getByKey({id: req.params.jobId}, user);
  if (job) {
    const providersModel = new ProvidersModel();
    const provider = await providersModel.getByKey({id: req.params.id}, user);
    if (provider) {
      const providerType = ProviderFactory.getProvider(provider.providerTypeId);
      try {
        const remoteJob = await providerType.getJob(job.providerInformation, provider.providerInstance, user);
        job.lastStatus = remoteJob.status;
        job.startTime = remoteJob.startTime;
        job.endTime = remoteJob.endTime;
        await jobsModel.update(job.id, job, user);
        res.status(200).json({job: _.merge(job, remoteJob)});
      } catch(err) {
        next(err);
      }
    } else {
      res.sendStatus(404);
    }
  } else {
    res.sendStatus(404);
  }
}

async function cancelJob(req, res) {
  const user = await req.user;
  const jobsModel = new JobsModel();
  const job = await jobsModel.getByKey({id: req.params.jobId}, user);
  if (job) {
    const providersModel = new ProvidersModel();
    const provider = await providersModel.getByKey({id: req.params.id}, user);
    if (provider) {
      const providerType = ProviderFactory.getProvider(provider.providerTypeId);
      await providerType.cancelJob(job.providerInformation, provider.providerInstance, user);
      res.sendStatus(204);
    } else {
      res.sendStatus(404);
    }
  } else {
    res.sendStatus(404);
  }
}

async function deleteJob(req, res) {
  const user = await req.user;
  const jobsModel = new JobsModel();
  const job = await jobsModel.getByKey({id: req.params.jobId}, user);
  if (job) {
    await jobsModel.delete(req.params.jobId, user);
    res.sendStatus(204);
  } else {
    res.sendStatus(404);
  }
}

async function startJob(req, res, next) {
  const user = await req.user;
  const mappingParameters = req.body;
  const name = mappingParameters.name;
  const clusterId = mappingParameters.clusterId;
  const clusterName = mappingParameters.clusterName;
  const applicationId = mappingParameters.applicationId;
  const bucket = mappingParameters.bucket;
  const jobType = mappingParameters.jobType;
  const logLevel = mappingParameters.selectedLogLevel;
  const rootLogLevel = mappingParameters.selectedRootLogLevel;
  const customLogLevels = mappingParameters.customLogLevels;
  const forceCopy = mappingParameters.forceCopy;
  const includePipelines = mappingParameters.includePipelines || false;
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  if (provider) {
    const application = await new ApplicationsModel().getByKey({ id: applicationId }, user);
    // Since pipelines are not saved with the application, go through the executions and identify all
    // pipelines that we need to include.
    application.pipelines = await addRequiredPipelines(application, user, includePipelines);
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
    const jarFiles = processJSON.jarFiles.concat(processJSON.remoteJars).filter(j => j.length > 0);
    // Add any runtime values
    if (mappingParameters) {
      application.globals = _.merge(application.globals, mappingParameters.globals);
      if (application.pipelineParameters) {
        const pipelineParameters = MetalusUtils.clone(application.pipelineParameters);
        if (mappingParameters.pipelineParameters &&
          mappingParameters.pipelineParameters.parameters &&
          mappingParameters.pipelineParameters.parameters.length > 0) {
          let param;
          mappingParameters.pipelineParameters.parameters.forEach((p) => {
            const paramIndex = _.findIndex(pipelineParameters.parameters, (params) => {
              return params.pipelineId === p.pipelineId;
            });
            if (paramIndex !== -1) {
              param = pipelineParameters.parameters[paramIndex];
              param.parameters = _.merge(param.parameters, p.parameters);
              pipelineParameters.parameters.splice(paramIndex, 1, param);
            } else {
              pipelineParameters.parameters.push(p)
            }
          });
        }
        application.pipelineParameters = pipelineParameters;
      } else {
        application.pipelineParameters = mappingParameters.pipelineParameters;
      }
    }
    // Bundle the application JSON into a jar so that it can be retrieved on the classpath
    const runConfig = await bundleApplicationJson(`${jarsDir}/staging`, application, applicationId);
    jarFiles.push(runConfig.jars[0]);
    runConfig.useCredentialProvider = mappingParameters.useCredentialProvider;
    runConfig.customFormValues = req.body.customFormValues;
    // handle custom parameters for streaming jobs
    let requiredStepLibrary;
    let streaming = false;
    switch(jobType) {
      case 'kinesis':
        runConfig.mainDriverClass = 'com.acxiom.aws.drivers.KinesisPipelineDriver';
        requiredStepLibrary = 'metalus-aws';
        runConfig.extraParameters = [
          '--duration-type',
          mappingParameters.streamingInfo.durationType,
          '--duration',
          mappingParameters.streamingInfo.duration,
          '--region',
          provider.providerInstance.region,
          '--streamName',
          mappingParameters.streamingInfo.streamName,
          '--consumerStreams',
          mappingParameters.streamingInfo.consumerStreams
        ];
        if (mappingParameters.streamingInfo.appName) {
          runConfig.extraParameters.push('--appName');
          runConfig.extraParameters.push(mappingParameters.streamingInfo.appName);
        }
        streaming = true;
        break;
      case 'kafka':
        runConfig.mainDriverClass = 'com.acxiom.kafka.drivers.KafkaPipelineDriver';
        requiredStepLibrary = 'metalus-kafka';
        runConfig.extraParameters = [];
        streaming = true;
        break;
      case 'pubsub':
        runConfig.mainDriverClass = 'com.acxiom.gcp.drivers.PubSubPipelineDriver';
        requiredStepLibrary = 'metalus-gcp';
        runConfig.extraParameters = [
          '--duration-type',
          mappingParameters.streamingInfo.durationType,
          '--duration',
          mappingParameters.streamingInfo.duration,
          '--subscription',
          mappingParameters.streamingInfo.subscription,
          '--projectId',
          provider.providerInstance.projectId
        ];
        streaming = true;
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
      runConfig.applicationJar = `${process.cwd()}/application_jars/${jarName}`;
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
      const classPath = await MetalusUtils.generateClasspath(jarFiles, stagingDir, 'jars/', repos, providerType.getScopes(streaming));
      runConfig.jars = Array.from(new Set(classPath.split(',')));
      runConfig.bucket = bucket;
      runConfig.stagingDir = stagingDir;
      runConfig.clusterId = clusterId;
      runConfig.clusterName = clusterName;
      runConfig.name = name;
      runConfig.logLevel = logLevel;
      runConfig.rootLogLevel = rootLogLevel;
      runConfig.customLogLevels = customLogLevels;
      runConfig.forceCopy = forceCopy;
      const runId = await providerType.executeApplication(provider.providerInstance, user, runConfig);

      const jobBody = {
        name,
        applicationId,
        applicationName: application.name,
        providerId: provider.id,
        projectId: user.defaultProjectId,
        jobType,
        lastStatus: 'PENDING',
        submitTime: new Date().getTime(),
        startTime: null,
        endTime: null,
        logLevel,
        rootLogLevel,
        customLogLevels,
        useCredentialProvider: mappingParameters.useCredentialProvider,
        providerInformation: {
          clusterId: clusterId.toString(),
          clusterName,
          runId,
          bucket,
          customFormValues: runConfig.customFormValues,
          applicationJar: runConfig.applicationJsonJar
        }
      };
      const jobsModel = new JobsModel();
      const job = await jobsModel.createOne(jobBody, user);
      res.status(201).json({job});
    } catch(err) {
      MetalusUtils.log(`Failed to execute job: ${JSON.stringify(err)}`);
      MetalusUtils.log(err);
      next(err);
    } finally {
      // Clean stagingDir
      MetalusUtils.removeDir(stagingDir);
    }
  } else {
    res.sendStatus(404);
  }
}

function addJarTags(obj, jarTags) {
  if (obj.tags && obj.tags.filter(t => t.endsWith('.jar')).length > 0) {
    obj.tags.filter(t => t.endsWith('.jar')).forEach(t => {
      if (jarTags.indexOf(t) === -1) {
        jarTags.push(t);
      }
    });
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
    addJarTags(p, jarTags);
    p.steps.forEach(s => {
      addJarTags(s, jarTags);
    });
  });
  return jarTags;
}

async function addRequiredPipelines(application, user, includePipelines) {
  const pipelinesModel = new PipelinesModel();
  const pipelines = [];
  const pipelineIds = [];
  let pipeline;
  for await (let exe of application.executions) {
    for await (let pipelineId of exe.pipelineIds) {
      if (pipelineIds.indexOf(pipelineId) === -1) {
        pipelineIds.push(pipelineId);
        pipeline = await pipelinesModel.getByKey({id: pipelineId}, user);
        if (includePipelines || !pipeline.tags ||
          pipeline.tags.filter(t => t.endsWith('.jar')).length === 0) {
          pipelines.push(pipeline)
        }
      }
    }
  }
  return pipelines.length > 0 ? pipelines : undefined;
}

async function bundleApplicationJson(jarsDir, application, applicationId) {
  const appName = `application_json-${new Date().getTime()}.jar`;
  const directoryPath = `${jarsDir}/metadata/applications`
  await MetalusUtils.mkdir(directoryPath, {recursive: true});
  await MetalusUtils.writefile(`${directoryPath}/${application.id}.json`, Buffer.from(JSON.stringify(application)));
  const cwd = process.cwd();
  process.chdir(jarsDir);
  await MetalusUtils.exec(process.env.JAR_COMMAND || 'jar', ['cf', appName, 'metadata']);
  await MetalusUtils.removeDir(`${jarsDir}/metadata`);
  process.chdir(cwd);
  return {
    mainDriverClass: '',
    driverSetup: 'com.acxiom.pipeline.applications.DefaultApplicationDriverSetup',
    applicationJar: '',
    applicationId,
    applicationJsonJar: appName,
    jars: [
      `${jarsDir}/${appName}`
    ]
  };
}
