
module.exports = (grunt) => {
  require('grunt-config-dir')(grunt, {
    configDir: require('path').resolve('tasks'),
  });

  grunt.registerTask('test:file', [
    'clean:coverage',
    'env:unit_test',
    'mocha_nyc:file'
  ]);

  grunt.registerTask('test:mongo', [
    'clean:coverage',
    'env:unit_test',
    'mocha_nyc:mongo'
  ]);

  grunt.registerTask('test:api', [
    'clean:coverage',
    'env:unit_test',
    'mocha_nyc:all_tests'
  ]);

  grunt.registerTask('build', [
    'test:api',
    'coveralls:report'
  ]);

  grunt.registerTask('prep-local', [
    'clean:metalus',
    'clean:applicationJars',
    'curl-dir:metalusUtils',
    'extract-metalus-utils',
    'curl-dir:applicationJars',
    'clean:localDocs',
    'markdown:local',
    'copy:localDocImages'
  ]);

  grunt.registerTask('docker-build', [
    'clean:localDocs',
    'markdown:local',
    'copy:localDocImages',
    'curl-dir:applicationJars'
  ]);
};
