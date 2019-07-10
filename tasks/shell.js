
module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-shell');

  return {
    api_tests: {
      options: {
        failOnError: true
      },
      command: [
        'nyc',
        '--check-coverage',
        'true',
        '--lines',
        '91',
        '--branches',
        '80',
        '--functions',
        '86',
        '--statements',
        '91',
        '--reporter',
        'text-summary',
        '--reporter',
        'lcov',
        'node_modules/mocha-parallel-tests/dist/bin/cli.js',
        '--ui',
        'bdd',
        '--reporter',
        'spec',
        './test',
        '--recursive'
      ].join(' ')
    }
  };
};
