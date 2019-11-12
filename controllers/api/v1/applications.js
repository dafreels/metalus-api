const ApplicationsModel = require('../../../models/applications.model');
const BaseRoutes = require('../../../lib/base.routes');

module.exports = function (router) {
    const baseRoutes = new BaseRoutes('application', 'applications', ApplicationsModel);
    baseRoutes.buildBasicCrudRoutes(router);

    // custom routes go here
};
