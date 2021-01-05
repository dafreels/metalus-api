const StepsModel = require('../../../models/steps.model');
const BaseRoutes = require('../../../lib/base.routes');
const ValidationError = require('../../../lib/ValidationError');

module.exports = function (router) {
  const baseRoutes = new BaseRoutes('step', 'steps', StepsModel);
  baseRoutes.buildBasicCrudRoutes(router);

  // custom routes
  router.get('/:id/template', getTemplate);
  router.put('/:id/template', updateTemplate);
};

async function getTemplate(req, res) {
  try {
    const stepsModel = new StepsModel();
    const user = await req.user;
    const record = await stepsModel.getTemplate(req.params.id, user);
    if (record) {
      const returnObj = {};
      returnObj['stepTemplate'] = record;
      res.json(returnObj);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    res.status(501).json({error: err});
  }
}

async function updateTemplate(req, res, next) {
  try {
    const stepsModel = new StepsModel();
    const user = await req.user;
    const record = await stepsModel.updateTemplate(req.params.id, req.body, user);
    const returnObj = {};
    returnObj['stepTemplate'] = record;
    res.json(returnObj);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(422).json({errors: err.getValidationErrors(), body: req.body});
    } else {
      next(err);
    }
  }
}
