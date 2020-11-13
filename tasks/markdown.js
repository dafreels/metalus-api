module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-markdown');

  return {
    local: {
      files: [
        {
          expand: true,
          src: 'docs/*.md',
          dest: 'docs/html/',
          ext: '.html',
          rename: function (dest, src) {
            const parts = src.split( '/' ),
              file = parts[ parts.length - 1 ],
              final = dest + file;

            if (final.indexOf('readme') !== -1) {
              return dest + 'index.html';
            }
            return final;
          }
        }
      ],
      options: {
        preCompile: (src, context) => {
          return src.replace(/readme.md/g, 'index.html')
            .replace(/\((?!http)(.+)(\.md)/g, '($1.html');
        }
      }
    }
  };
};
