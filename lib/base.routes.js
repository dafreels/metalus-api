class BaseRoutes {
  constructor(singular, plural, model) {
    this.singleName = singular;
    this.pluralName = plural;
    this.model = new model();
  }

  buildGetAllRoute(router) {
    router.get('/', async (req, res) => {
      try {
        const records = await this.model.getAll();
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
        const record = await this.model.getByKey({id: req.params.id});
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
    router.post('/', async (req, res) => {
      await this.tagProjectInformation(req);
      if (req.body && Array.isArray(req.body)) {
        const results = await this.model.createMany(req.body);
        if (results.errorList.length === 0) {
          const returnObj = {};
          returnObj[this.pluralName] = results.successList;
          res.status(201).json(returnObj);
        } else {
          res.status(422).json({errors: results.errorList, successes: results.successList});
        }
      } else if (req.body && Object.keys(req.body).length > 0) {
        try {
          const record = await this.model.createOne(req.body);
          const returnObj = {};
          returnObj[this.singleName] = record;
          res.status(201).json(returnObj);
        } catch (err) {
          res.status(422).json({errors: err.getValidationErrors(), body: req.body});
        }
      } else {
        res.status(400).send({message: 'POST request missing body'});
      }
    });
  }

  async tagProjectInformation(req) {
    const user = await req.user;
    if (user) {
      req.body.project = {
        userId: user.id,
        projectId: user.defaultProjectId
      };
    }
  }

  buildUpdateOneRoute(router) {
    router.put('/:id', async (req, res) => {
      await this.tagProjectInformation(req);
      try {
        const record = await this.model.update(req.params.id, req.body);
        const returnObj = {};
        returnObj[this.singleName] = record;
        res.json(returnObj);
      } catch (err) {
        res.status(500).json({errors: err.message, body: req.body});
      }
    });
  }

  buildDeleteRoute(router) {
    router.delete('/:id', async (req, res) => {
      try {
        await this.model.delete(req.params.id);
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
