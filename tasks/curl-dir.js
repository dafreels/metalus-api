module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-curl');

  return {
    metalusUtils: {
      src: [
        'https://github.com/Acxiom/metalus/releases/download/release_1_7_1/metalus-utils_2.11-spark_2.4-1.7.1.tar.gz'
      ],
      dest: '.'
    }
  };
};
