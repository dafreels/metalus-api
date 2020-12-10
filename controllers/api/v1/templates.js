const MetalusUtils = require('../../../lib/metalus-utils');

module.exports = function (router) {
  router.get('/', getTemplates);
};

async function getTemplates(req, res, next) {
  try {
    let templatesDir = getTemplatesDir(req);
    const templateList = await MetalusUtils.readdir(templatesDir);
    const response = [];
    for await (const template of templateList) {
      const json = await MetalusUtils.readfile(`${templatesDir}/${template}/library.json`);
      const templateJson = JSON.parse(json);
      templateJson.id = template;
      response.push(templateJson);
    }
    res.status(200).json({ templates: response });
  } catch (err) {
    next(err);
  }
}

function getTemplatesDir(req) {
  return req.app.kraken.get('baseTemplatesDir') || `${process.cwd()}/templates`;
}
