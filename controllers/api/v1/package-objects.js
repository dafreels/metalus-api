const PackageObjectsModel = require('../../../models/package-objects.model');
const BaseRoutes = require('../../../lib/base.routes');

const baseRoutes = new BaseRoutes('package-object', 'package-objects', PackageObjectsModel);

module.exports = function (router) {
    baseRoutes.buildBasicCrudRoutes(router);

    router.patch('/:id/validate-object', (req, res) => {
        baseRoutes.model.validateJson(req.params.id, req.body)
            .then(isValid => {
                res.json({ isValid });
            })
            .catch(err => {
                res.status(501).json({error: err});
            });
    });
};
