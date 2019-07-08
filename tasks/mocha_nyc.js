module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-mocha-nyc');

  return {
    functional: {
      src: ['test/functional/**/*.js'],
      options: {
        timeout: 30000,
        'check-leaks': true,
        reportFormats: ['lcov', 'text'],
      }
    }
  };
};
