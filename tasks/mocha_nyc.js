module.exports = function nyc(grunt) {
  // Load task
  grunt.loadNpmTasks('grunt-mocha-nyc');
  return {
    file: {
      src: ['test/file/**/*.js'],
      options: {
        timeout: 30000,
        'check-leaks': true,
        reportFormats: ['lcov', 'text'],
      }
    },
    mongo: {
      src: ['test/mongo/**/*.js'],
      options: {
        timeout: 30000,
        'check-leaks': true,
        reportFormats: ['lcov', 'text'],
      }
    },
    api: {
      src: ['test/**/**/*.js'],
      options: {
        timeout: 30000,
        'check-leaks': true,
        reportFormats: ['lcov', 'text'],
      }
    }
  };
};
