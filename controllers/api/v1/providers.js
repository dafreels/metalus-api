const BaseRoutes = require('../../../lib/base.routes');
const ProviderFactory = require('../../../lib/providers/provider-factory');
const ApplicationsModel = require('../../../models/applications.model');
const JobsModel = require('../../../models/jobs.model');
const PipelinesModel = require('../../../models/pipelines.model');
const ProvidersModel = require('../../../models/providers.model');
const ValidationError = require('../../../lib/ValidationError');
const MetalusUtils = require('../../../lib/metalus-utils');

module.exports = function (router) {
  const baseRoutes = new BaseRoutes('provider', 'providers', ProvidersModel);
  baseRoutes.buildDeleteRoute(router);

  router.get('/', getProviders);
  router.post('/', createProvider);
  router.get('/:id', getProvider);
  router.get('/:id/clusters', getClusters);
  router.get('/:id/new-cluster-form', getNewClusterForm);
  router.get('/:id/jobs', listJobs);
  router.post('/:id/jobs', startJob);
};

async function getNewClusterForm(req, res) {
  const user = await req.user;
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  if (provider) {
    const providerType = ProviderFactory.getProvider(provider.providerTypeId);
    const form = await providerType.getNewClusterForm(provider.providerInstance, user);
    res.status(200).json({form});
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
      const clusters = await providerType.getClusters(provider.providerInstance, user.secretKey);
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
  const providersModel = new ProvidersModel();
  const provider = await providersModel.getByKey({id: req.params.id}, user);
  if (provider) {
    const application = new ApplicationsModel().getByKey({ id: applicationId }, user);
    const pipelinesModel = new PipelinesModel();
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
    const jarsDir = `${MetalusUtils.getProjectJarsBaseDir(req)}/${user.id}/${user.defaultProjectId}`;
    let processJSON = {
      jarFiles: [],
      repos: '',
      remoteJars: []
    };
    try {
      processJSON = JSON.parse(await MetalusUtils.readfile(`${jarsDir}/processedJars.json`));
    } catch (err) {
      // Do nothing since we are just trying to load a file that may not exist
    }
    // Combine the local and remote jars that were uploaded
    const jarFiles = processJSON.jarFiles.concat(processJSON.remoteJars);
    // Iterate the jarTags and add anything that may be missing. Metalus jars that aren't local will get the Maven remote location
    let version;
    jarTags.forEach((tag) => {
      if (jarFiles.findIndex(f => f.indexOf(tag) === -1) === -1) {
        const index = tag.lastIndexOf('-');
        version = tag.substring(index + 1, tag.indexOf('.jar'));
        jarFiles.push(`https://repo1.maven.org/maven2/com/acxiom/${tag.substring(0, index)}/${version}/${tag}`);
      }
    });
    try {
      const providerType = ProviderFactory.getProvider(provider.providerTypeId);
      const stagingDir = `${jarsDir}/staging`;
      const runId = await providerType.executeApplication(provider.providerInstance, user,
        application, clusterId, jarFiles, stagingDir, processJSON.repos);
      const jobBody = {
        name,
        applicationId,
        applicationName: application.name,
        providerId: provider.id,
        projectId: user.defaultProjectId,
        providerInformation: {
          clusterId,
          clusterName,
          runId
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
