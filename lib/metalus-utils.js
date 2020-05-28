const util = require('util');
const fs = require('fs');
const execFile = require('child_process').execFile;


const MetalusUtils = function() {
};

MetalusUtils.rmdir = util.promisify(fs.rmdir);
MetalusUtils.unlink = util.promisify(fs.unlink);
MetalusUtils.readdir = util.promisify(fs.readdir);
MetalusUtils.stat = util.promisify(fs.stat);
MetalusUtils.mkdir = util.promisify(fs.mkdir);
MetalusUtils.rename = util.promisify(fs.rename);
MetalusUtils.exec = util.promisify(execFile);

MetalusUtils.removeDir = function removeDir(path) {
  let files = [];
  if( fs.existsSync(path) ) {
    if (fs.lstatSync(path).isDirectory()) {
      files = fs.readdirSync(path);
      files.forEach(function (file, index) {
        const curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          removeDir(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    } else {
      fs.unlinkSync(path);
    }
  }
};

module.exports = MetalusUtils;
