const StepsModel = require('../../../models/steps.model');
const BaseRoutes = require('../../../lib/base.routes');

module.exports = function (router) {
  const baseRoutes = new BaseRoutes('step', 'steps', StepsModel);
  baseRoutes.buildBasicCrudRoutes(router);

  // custom routes go here
};
