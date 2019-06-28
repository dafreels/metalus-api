const ApplicationsModel = require('../../../models/applications.model');
const BaseRoutes = require('../../../lib/base.routes');

const baseRoutes = new BaseRoutes('application', 'applications', ApplicationsModel);

module.exports = function (router) {
    baseRoutes.buildBasicCrudRoutes(router);

    // custom routes go here
};
