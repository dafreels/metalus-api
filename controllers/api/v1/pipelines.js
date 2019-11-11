const PipelinesModel = require('../../../models/pipelines.model');
const BaseRoutes = require('../../../lib/base.routes');

module.exports = function (router) {
  const baseRoutes = new BaseRoutes('pipeline', 'pipelines', PipelinesModel);
  baseRoutes.buildBasicCrudRoutes(router);

  // custom routes go here
};
