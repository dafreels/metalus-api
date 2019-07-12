
module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-shell');

  return {
    file_tests: {
      options: {
        failOnError: true
      },
      command: [
        'NODE_ENV=unit',
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
        './test/file',
        '--recursive'
      ].join(' ')
    },
    mongo_tests: {
      options: {
        failOnError: true
      },
      command: [
        'NODE_ENV=unit',
        'nyc',
        '--check-coverage',
        'true',
        '--lines',
        '91',
        '--branches',
        '79',
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
        './test/mongo',
        '--recursive'
      ].join(' ')
    },
    all_tests: {
      options: {
        failOnError: true
      },
      command: [
        'NODE_ENV=unit',
        'nyc',
        '--check-coverage',
        'true',
        '--lines',
        '89',
        '--branches',
        '73',
        '--functions',
        '87',
        '--statements',
        '89',
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
