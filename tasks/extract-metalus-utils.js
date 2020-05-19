const tar = require('tar');
const fs = require('fs');

const fileName = './metalus-utils_2.11-spark_2.4-1.6.6.tar.gz';

module.exports = function (grunt) {
  grunt.registerTask('extract-metalus-utils', function () {
    const done = this.async();
    tar.x({
      file: fileName,
      cwd: '.'
    })
      .then(() => {
        fs.unlink(fileName, (err) => {
          if (err) throw err;
          grunt.log.writeln('Metalus extracted');
          done();
        });
      });
  });
};
