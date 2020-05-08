module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-curl');

  return {
    metalusUtils: {
      src: [
        'https://github.com/Acxiom/metalus/releases/download/release_1_6_6/metalus-utils_2.11-spark_2.4-1.6.6.tar.gz'
      ],
      dest: '.'
    }
  };
};
