module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-curl');

  return {
    metalusUtils: {
      src: [
        'https://github.com/Acxiom/metalus/releases/download/1.8.0/metalus-utils_2.11-spark_2.4-1.8.0.tar.gz'
      ],
      dest: '.'
    },
    applicationJars: {
      src: [
        'https://github.com/Acxiom/metalus/releases/download/1.8.4/metalus-application_2.11-spark_2.4-1.8.4.jar',
        'https://github.com/Acxiom/metalus/releases/download/1.8.4/metalus-application_2.12-spark_2.4-1.8.4.jar',
        'https://github.com/Acxiom/metalus/releases/download/1.8.4/metalus-application_2.12-spark_3.0-1.8.4.jar',
        'https://github.com/Acxiom/metalus/releases/download/1.8.4/metalus-application_2.12-spark_3.1-1.8.4.jar'
      ],
      dest: 'application_jars'
    }
  };
};
