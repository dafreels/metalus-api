class BaseRoutes {
    constructor(singular, plural, model) {
        this.singleName = singular;
        this.pluralName = plural;
        this.model = new model();
    }

    buildGetAllRoute(router) {
        router.get('/', (req, res) => {
            this.model.getAll()
                .then(records => {
                    if (records && records.length > 0) {
                      const returnObj = {};
                      returnObj[this.pluralName] = records;
                      res.status(200).json(returnObj);
                    } else {
                      res.sendStatus(204);
                    }
                })
                .catch(err => {
                    res.status(501).json({error: err});
                });
        });
    }

    buildGetOneRoute(router) {
        router.get('/:id', (req, res) => {
            this.model.getByKey({id: req.params.id})
                .then((record) => {
                  if (record) {
                    const returnObj = {};
                    returnObj[this.singleName] = record;
                    res.json(returnObj);
                  } else {
                    res.sendStatus(204);
                  }
                })
                .catch(err => {
                    res.status(501).json({error: err});
                });
        });
    }

    buildCreateRoute(router) {
        router.post('/', (req, res) => {
            if (req.body && Array.isArray(req.body)) {
                this.model.createMany(req.body)
                    .then(results => {
                        if (results.errorList.length === 0) {
                            const returnObj = {};
                            returnObj[this.pluralName] = results.successList;
                            res.status(201).json(returnObj);
                        } else {
                            res.status(422).json({errors: results.errorList, successes: results.successList});
                        }
                    });
            } else if(req.body && Object.keys(req.body).length > 0) {
                this.model.createOne(req.body)
                    .then(record => {
                        const returnObj = {};
                        returnObj[this.singleName] = record;
                        res.status(201).json(returnObj);
                    })
                    .catch(err => {
                        res.status(422).json({ errors: err, body: req.body });
                    });
            } else {
                res.status(400).send({message: 'POST request missing body'});
            }
        });
    }

    buildUpdateOneRoute(router) {
        router.put('/:id', (req, res) => {
            this.model.update(req.params.id, req.body)
                .then(record => {
                    const returnObj = {};
                    returnObj[this.singleName] = record;
                    res.json(returnObj);
                })
                .catch(err => {
                    res.status(500).json({ errors: err, body: req.body });
                });
        });
    }

    buildDeleteRoute(router) {
        router.delete('/:id', (req, res) => {
            this.model.delete(req.params.id)
                .then(() => {
                    res.sendStatus(204);
                })
                .catch(err => {
                    res.status(500).json({errors: err});
                });
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
