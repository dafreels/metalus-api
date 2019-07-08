
module.exports = (grunt) => {
  require('grunt-config-dir')(grunt, {
    configDir: require('path').resolve('tasks'),
  });

  grunt.registerTask('test:functional', [
    'clean:coverage',
    'mocha_nyc:functional'
  ]);
};
