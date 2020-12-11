const ExecutionsModel = require('../../../models/executions.model');
const BaseRoutes = require('../../../lib/base.routes');

module.exports = function (router) {
  const baseRoutes = new BaseRoutes('execution', 'executions', ExecutionsModel);
  baseRoutes.buildBasicCrudRoutes(router);

  // custom routes go here
};
