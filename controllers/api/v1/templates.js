const MetalusUtils = require('../../../lib/metalus-utils');

module.exports = function (router) {
  router.get('/', getTemplates);
};

async function getTemplates(req, res, next) {
  try {
    const templatesDir = getTemplatesDir(req);
    const templatesJSON = JSON.parse(await MetalusUtils.readfile(`${templatesDir}/templates.json`));

    res.status(200).json({ template: templatesJSON });
  } catch (err) {
    next(err);
  }
}

function getTemplatesDir(req) {
  return req.app.kraken.get('baseTemplatesDir') || `${process.cwd()}`;
}
