
module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-contrib-clean');

  return {
    coverage: {
      src: ['.nyc_output', 'coverage']
    },
    metalus: {
      src: ['metalus-utils']
    }
  };
};
