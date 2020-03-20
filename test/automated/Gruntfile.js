module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),

      jshint: {
        // This is the list of files on which grunt will run JSHint
        all: ['Gruntfile.js', 'package.json', '*.js'],
        options: {
          curly: true, // Always require {} blocks for if/while statements
          eqeqeq: true // Always require triple equals ===
        }
      },

      watch: {
        // These are the files that grunt will watch for changes.
        files: ['Gruntfile.js', 'package.json', '*.js'],
        // These are the tasks that are run on each of the above files every time there is a change.
        tasks: ['jshint', 'mochaTest'],
        options: {
          atBegin: true
        }
      },

      mochaTest: {
        ObjectEditorTest: {
            options: {
                timeout: 200000,
                noFail : true //to prevent the task failing on failed tests. 
            },
            src: ['tests/ObjectEditorTest.js']
        },

        BugBashTest: {
          options: {
              timeout: 200000,
              noFail : true //to prevent the task failing on failed tests. 
          },
          src: ['tests/BugBashTest.js']
        },

        DisableResultTest: {
          options: {
              timeout: 200000,
              noFail : true //to prevent the task failing on failed tests. 
          },
          src: ['tests/DisableResultTest.js']
        },

        PipelinesValidationTest: {
          options: {
              timeout: 200000,
              noFail : true //to prevent the task failing on failed tests. 
          },
          src: ['tests/PipelinesValidationTest.js']
        },

      },
      
    });
  
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask('default', ['jshint']);
    grunt.registerTask('MochaTest', ['mochaTest']);

  };