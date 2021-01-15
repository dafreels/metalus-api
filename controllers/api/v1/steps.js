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
    const step = await this.model.getByKey({id: req.params.id}, user);
    if (!step) {
      res.sendStatus(404);
    } else {
      const record = await stepsModel.getTemplate(req.params.id, user);
      if (record) {
        const returnObj = {};
        returnObj['stepTemplate'] = record;
        delete record._id;
        delete record.id;
        res.status(200).json(returnObj);
      } else {
        res.sendStatus(204);
      }
    }
  } catch (err) {
    res.status(501).json({error: err});
  }
}

async function updateTemplate(req, res, next) {
  try {
    const stepsModel = new StepsModel();
    const user = await req.user;
    const update = req.body;
    update.id = req.params.id;
    const record = await stepsModel.updateTemplate(req.params.id, update, user);
    const returnObj = {};
    returnObj['stepTemplate'] = record;
    res.status(200).json(returnObj);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(422).json({errors: err.getValidationErrors(), body: req.body});
    } else {
      next(err);
    }
  }
}
