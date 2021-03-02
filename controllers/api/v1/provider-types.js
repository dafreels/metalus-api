const ProviderFactory = require('../../../lib/providers/provider-factory');

module.exports = function (router) {
  router.get('/', getProviders);
  router.get('/:id/form', newForm);
};

async function getProviders(req, res) {
  res.status(200).json({providers: ProviderFactory.getProviderList()});
}

async function newForm(req, res) {
  const user = await req.user;
  const provider = ProviderFactory.getProvider(req.params.id);
  if (provider) {
    const form = await provider.getNewForm(user);
    res.status(200).json({form});
  } else {
    res.sendStatus(404);
  }
}
