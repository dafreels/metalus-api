module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-coveralls');
  return {
    report: {
      src: 'coverage/lcov.info'
    }
  }
};
