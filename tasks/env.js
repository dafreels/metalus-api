module.exports = function env(grunt) {
  // Load task
  grunt.loadNpmTasks('grunt-env');

  return {
    unit_test: {
      NODE_ENV: 'unit'
    }
  };
};
