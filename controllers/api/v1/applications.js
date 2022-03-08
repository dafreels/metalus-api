const ApplicationsModel = require('../../../models/applications.model');
const BaseRoutes = require('../../../lib/base.routes');
const JobsModel = require('../../../models/jobs.model');
const RunProfilesModel = require('../../../models/run-profiles.model');
const MetalusUtils = require("../../../lib/metalus-utils");

module.exports = function (router) {
  const baseRoutes = new BaseRoutes('application', 'applications', ApplicationsModel);
  baseRoutes.buildBasicCrudRoutes(router, false);
  // custom routes go here
  router.delete('/:id', deleteApplication);
  router.get('/:id/jobs', listJobs);
  router.get('/:id/run-profile', getRunProfile);
  router.put('/:id/run-profile', updateRunProfile);
  router.post('/:id/run-profile', addRunProfile);
};

async function deleteApplication(req, res) {
  try {
    const user = await req.user;
    await new ApplicationsModel().delete(req.params.id, user);
    const runProfilesModel = new RunProfilesModel();
    const profiles = await runProfilesModel.getByApplication(req.params.id, user);
    if (profiles && profiles.length > 0) {
      for await (let profile of profiles) {
        await runProfilesModel.delete(profile.id, user);
      }
    }
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({error: err.message});
  }
}

async function listJobs(req, res, next) {
  const user = await req.user;
  const jobsModel = new JobsModel();
  const jobs = await jobsModel.getByApplication(req.params.id, user);
  if (jobs && jobs.length > 0) {
    res.status(200).json({jobs: jobs.sort((a, b) => b.creationDate.getTime() - a.creationDate.getTime())});
  } else {
    res.sendStatus(204);
  }
}

async function getRunProfile(req, res) {
  const user = await req.user;
  const runProfilesModel = new RunProfilesModel();
  const newProfile = await runProfilesModel.getByApplication(req.params.id, user);
  if (newProfile && newProfile.length > 0) {
    res.status(200).json({ runProfile: newProfile[0] });
  } else {
    res.sendStatus(404);
  }
}

async function addRunProfile(req, res) {
  const user = await req.user;
  const profile = req.body;
  const runProfilesModel = new RunProfilesModel();
  try {
    const newProfile = await runProfilesModel.createOne(profile, user);
    res.status(201).json({runProfile : newProfile });
  } catch (err) {
    MetalusUtils.log(`Failed to add run profile: ${JSON.stringify(err)}`);
    MetalusUtils.log(err);
    res.status(400).json({
      error: JSON.stringify(err)
    });
  }
}

async function updateRunProfile(req, res) {
  const user = await req.user;
  const profile = req.body;
  const runProfilesModel = new RunProfilesModel();
  try {
    const newProfile = await runProfilesModel.update(profile.id, profile, user);
    res.status(200).json({runProfile : newProfile });
  } catch (err) {
    MetalusUtils.log(`Failed to update run profile: ${JSON.stringify(err)}`);
    MetalusUtils.log(err);
    res.status(400).json({
      error: JSON.stringify(err)
    });
  }
}
