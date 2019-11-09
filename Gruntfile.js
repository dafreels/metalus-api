
module.exports = (grunt) => {
  require('grunt-config-dir')(grunt, {
    configDir: require('path').resolve('tasks'),
  });

  grunt.registerTask('test:file', [
    'clean:coverage',
    'shell:file_tests'
  ]);

  grunt.registerTask('test:file1', [
    'clean:coverage',
    'mocha_nyc:file'
  ]);

  grunt.registerTask('test:mongo', [
    'clean:coverage',
    'shell:mongo_tests'
  ]);

  grunt.registerTask('test:mongo1', [
    'clean:coverage',
    'mocha_nyc:mongo'
  ]);

  grunt.registerTask('test:api', [
    'clean:coverage',
    'shell:all_tests'
  ]);

  grunt.registerTask('test:api1', [
    'clean:coverage',
    'mocha_nyc:api'
  ]);
};
