const ApplicationsModel = require('../../../models/applications.model');
const BaseRoutes = require('../../../lib/base.routes');
const JobsModel = require('../../../models/jobs.model');

module.exports = function (router) {
    const baseRoutes = new BaseRoutes('application', 'applications', ApplicationsModel);
    baseRoutes.buildBasicCrudRoutes(router);
    // custom routes go here
  router.get('/:id/jobs', listJobs);
};

async function listJobs(req, res, next) {
  const user = await req.user;
  const jobsModel = new JobsModel();
  const jobs = await jobsModel.getByApplication(req.params.id, user);
  if (jobs && jobs.length > 0) {
    res.status(200).json({jobs});
  } else {
    res.sendStatus(204);
  }
}
