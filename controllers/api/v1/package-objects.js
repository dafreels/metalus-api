const PackageObjectsModel = require('../../../models/package-objects.model');
const BaseRoutes = require('../../../lib/base.routes');

module.exports = function (router) {
  const baseRoutes = new BaseRoutes('package-object', 'package-objects', PackageObjectsModel);
  baseRoutes.buildBasicCrudRoutes(router);

  router.patch('/:id/validate-object', (req, res) => {
    baseRoutes.model.validateJson(req.params.id, req.body)
      .then(result => {
        if (result.isValid) {
          res.status(200).json(result);
        } else {
          res.status(422).json(result);
        }
      })
      .catch(err => {
        res.status(501).json({error: err});
      });
  });
};
