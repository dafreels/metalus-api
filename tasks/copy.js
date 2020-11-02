module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-contrib-copy');

  return {
    localDocImages: {
      expand: true,
      cwd: 'docs/images',
      src: ['**'],
      dest: 'docs/html/images/'
    },
    dockerDocImages: {
      expand: true,
      cwd: 'docs/images',
      src: ['**'],
      dest: '/opt/metalus/dist/metalus/docs/images/'
    }
  };
};
