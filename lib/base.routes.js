const ValidationError = require('./ValidationError');
class BaseRoutes {
  constructor(singular, plural, model) {
    this.singleName = singular;
    this.pluralName = plural;
    this.model = new model();
  }

  buildGetAllRoute(router) {
    router.get('/', async (req, res) => {
      try {
        const user = await this.getUser(req);
        const records = await this.model.getAll(user);
        if (records && records.length > 0) {
          const returnObj = {};
          returnObj[this.pluralName] = records;
          res.status(200).json(returnObj);
        } else {
          res.sendStatus(204);
        }
      } catch (err) {
        res.status(501).json({error: err});
      }
    });
  }

  buildGetOneRoute(router) {
    router.get('/:id', async (req, res) => {
      try {
        const user = await this.getUser(req);
        const record = await this.model.getByKey({id: req.params.id}, user);
        if (record) {
          const returnObj = {};
          returnObj[this.singleName] = record;
          res.json(returnObj);
        } else {
          res.sendStatus(404);
        }
      } catch (err) {
        res.status(501).json({error: err});
      }
    });
  }

  buildCreateRoute(router) {
    router.post('/', async (req, res, next) => {
      const user = await this.getUser(req);
      if (req.body && Array.isArray(req.body)) {
        const results = await this.model.createMany(req.body, user);
        if (results.errorList.length === 0) {
          const returnObj = {};
          returnObj[this.pluralName] = results.successList;
          res.status(201).json(returnObj);
        } else {
          res.status(422).json({errors: results.errorList, successes: results.successList});
        }
      } else if (req.body && Object.keys(req.body).length > 0) {
        try {
          const record = await this.model.createOne(req.body, user);
          const returnObj = {};
          returnObj[this.singleName] = record;
          res.status(201).json(returnObj);
        } catch (err) {
          if (err instanceof ValidationError) {
            res.status(422).json({errors: err.getValidationErrors(), body: req.body});
          } else {
            next(err);
          }
        }
      } else {
        res.status(400).send({message: 'POST request missing body'});
      }
    });
  }

  async getUser(req) {
    return await req.user;
  }

  buildUpdateOneRoute(router) {
    router.put('/:id', async (req, res, next) => {
      try {
        const user = await this.getUser(req);
        const record = await this.model.update(req.params.id, req.body, user);
        const returnObj = {};
        returnObj[this.singleName] = record;
        res.json(returnObj);
      } catch (err) {
        if (err instanceof ValidationError) {
          res.status(422).json({errors: err.getValidationErrors(), body: req.body});
        } else {
          next(err);
        }
      }
    });
  }

  buildDeleteRoute(router) {
    router.delete('/:id', async (req, res) => {
      try {
        const user = await this.getUser(req);
        await this.model.delete(req.params.id, user);
        res.sendStatus(204);
      } catch (err) {
        res.status(500).json({errors: err.message});
      }
    });
  }

  buildBasicCrudRoutes(router) {
    this.buildGetAllRoute(router);
    this.buildGetOneRoute(router);
    this.buildCreateRoute(router);
    this.buildUpdateOneRoute(router);
    //this.buildUpdateManyRoute(router);
    this.buildDeleteRoute(router);
  }
}

module.exports = BaseRoutes;
