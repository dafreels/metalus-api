
module.exports = (grunt) => {
  require('grunt-config-dir')(grunt, {
    configDir: require('path').resolve('tasks'),
  });

  grunt.registerTask('test:file', [
    'clean:coverage',
    'env:unit_test',
    'mocha_nyc:file'
  ]);

  grunt.registerTask('test:file1', [
    'clean:coverage',
    'env:unit_test',
    'mocha_nyc:file'
  ]);

  grunt.registerTask('test:mongo1', [
    'clean:coverage',
    'env:unit_test',
    'mocha_nyc:mongo'
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

  grunt.registerTask('test:api1', [
    'clean:coverage',
    'env:unit_test',
    'mocha_nyc:all_tests'
  ]);
};
