
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
        '70',
        '--branches',
        '60',
        '--functions',
        '70',
        '--statements',
        '70',
        '--reporter',
        'text-summary',
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
