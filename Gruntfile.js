'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    jqueryjson: {
      dependencies: {
        jquery: '>=2.1.x'
      },
      docs: 'https://github.com/openmania/mapsmanager/blob/master/README.md',
      demo: 'http://openmania.github.io/mapsmanager'
    },
    banner: '/*!\n' +
            ' * <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
            ' * <%= grunt.template.today("yyyy-mm-dd") %>\n' +
            ' * Copyright (c) 2009-<%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
            ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n' +
            ' */\n',
    // Task configuration.
    jshint: {
      options: { jshintrc: true },
      gruntfile: { src: 'Gruntfile.js' },
      core: {
        options: { jshintrc: 'src/.jshintrc' },
        src: 'src/**/*.js'
      },
      lib: {
        options: { jshintrc: 'src/.jshintrc' },
        src: 'src/lib/*.js'
      },
      docs: {
        options: { jshintrc: 'src/.jshintrc' },
        src: 'src/docs/*.js'
      },
      test: { src: 'test/**.js' }
    },

    jscs: {
      gruntfile: { src: '<%= jshint.gruntfile.src %>' },
      core: {
        options: { config: 'src/.jscsrc' },
        src: '<%= jshint.core.src %>'
      },
      lib: {
        options: { config: 'src/.jscsrc' },
        src: '<%= jshint.lib.src %>'
      },
      docs: {
        options: { config: 'src/.jscsrc' },
        src: '<%= jshint.docs.src %>'
      },
      test: { src: '<%= jshint.test.src %>' }
    },

    clean: {
      lib: {
        files: [{ force: true, src: 'dist' }]
      },
      docsall: {
        files: [{ force: true, src: [ 'docs/js/*', '!docs/js/*.json'] }]
      },
      docslib: {
        files: [{ force: true, src: 'docs/js/lib' }]
      },
      docs: {
        files: [{ force: true, src: [ 'docs/js/*.js', 'docs/js/src' ] }]
      },
      tmp: {
        files: [{ force: true, src: '.tmp' }]
      }
    },

    copy: {
      core: {
        files: [
          { expand: true, cwd: 'src/lib/', src: '*.js', dest: '.tmp/lib/src/' },
          { expand: true, cwd: 'src/docs/', src: '*.js', dest: '.tmp/docs/src/' }
        ]
      },
      srclib: {
        expand: true,
        cwd: 'src/lib/',
        src: '*.js',
        dest: '.tmp/lib/src/'
      },
      srcdocs: {
        expand: true,
        cwd: 'src/docs/',
        src: '*.js',
        dest: '.tmp/docs/src/'
      },
      lib: {
        files: [
          { expand: true, cwd: '.tmp/lib/', src: '**',  dest: 'dist/' },
          { expand: true, cwd: '.tmp/',     src: 'lib/**', dest: 'docs/js/' }
        ]
      },
      docs: {
        expand: true,
        cwd: '.tmp/docs/',
        src: '**',
        dest: 'docs/js/'
      }
    },

    entrypoint: {
      options: {
        banner: '<%= banner %>'
      },
      lib: {
        files: [{
          src: '<%= jshint.core.src %>',
          dest: '<%= pkg.main %>'
        }]
      }
    },

    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      lib: {
        src: 'src/lib/**.js',
        dest: 'dist/<%= pkg.name %>.js'
      },
    },

    uglify: {
      options: {
        banner: '<%= banner %>',
        compress: {
          warnings: false
        },
        mangle: true,
        sourceMap: true
      },
      lib: {
        options: {
          exceptionsFiles: ['src/lib_exceptions.json']
        },
        src: ['.tmp/lib/src/**.js'],
        dest: '.tmp/lib/<%= pkg.name %>.min.js'
      },
      docs: {
        options: {
          exceptionsFiles: ['src/docs_exceptions.json']
        },
        src: ['.tmp/docs/src/**.js'],
        dest: '.tmp/docs/script.min.js'
      }
    },

    compress: {
      core: {
        options: {
          archive: 'dist/mapsmanager-<%= pkg.version %>.zip',
          mode: 'zip',
          level: 9,
          pretty: true
        },
        expand: true,
        cwd: 'dist/',
        src: ['**', '!<%= entrypoint.lib.dest %>', '!**/*.zip']
      }
    },

    jekyll: {
      docs: {}
    },

    connect: {
      options: {
        open: true,
        port: 9000,
        livereload: 35729,
        // Change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      docs: {
        options: {
          middleware: function (connect) {
            return [
              connect().use('/js', connect.static('./bower_components')),
              connect.static('gh-pages')
            ];
          }
        }
      }
    },

    // Automatically inject Bower components into the HTML file
    wiredep: {
      docs: {
        src: ['docs/_layouts/index.html', 'docs/_layouts/default.html'],
        fileTypes: {
          html: {
            replace: {
              js: function (filePath) {
                return '<script src="/js' + filePath.replace('../../bower_components/', '/') + '"></script>';
              },
              css: '<link rel="stylesheet" href="css/{{filePath}}" />'
            }
          }
        }
      }
    },

    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: ['src/lib/**.js', 'src/lib_**.json'],
        tasks: [ 'rebuild:lib' ]
      },
      docs: {
        files: ['src/docs/**.js', 'src/docs_**.json'],
        tasks: [ 'rebuild:docs' ]
      },
      jekyll: {
        options: { livereload: '<%= connect.options.livereload %>' },
        files: ['docs/**/**', '_config.yml'],
        tasks: [ 'jekyll:docs' ]
      }
    },

    qunit: {
      files: ['test/**/*.html']
    }
  });

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);
  grunt.loadTasks('grunt');
  require('time-grunt')(grunt);

  // Default task.
  grunt.registerTask('build', [
    'jshint:core',
    'jscs:core',
    'clean:lib',
    'clean:docsall',
    'clean:tmp',
    'copy:core',
    'concat:lib',
    'uglify:lib',
    'uglify:docs',
    // 'closurecompiler:lib',
    // 'closurecompiler:docs',
    'copy:lib',
    'copy:docs',
    'clean:tmp',
    'entrypoint:lib',
    'wiredep:docs'
  ]);

  grunt.registerTask('rebuild:lib', [
    'jshint:lib',
    'jscs:lib',
    'clean:lib',
    'clean:docslib',
    'clean:tmp',
    'copy:srclib',
    'concat:lib',
    'uglify:lib',
    // 'closurecompiler:lib',
    'copy:lib',
    'clean:tmp'
  ]);

  grunt.registerTask('rebuild:docs', [
    'jshint:docs',
    'jscs:docs',
    'clean:docs',
    'clean:tmp',
    'copy:srcdocs',
    'uglify:docs',
    // 'closurecompiler:docs',
    'copy:docs',
    'clean:tmp',
    'wiredep:docs'
  ]);

  grunt.registerTask('docs', [
    'build',
    'jekyll:docs',
    'connect:docs',
    'watch'
  ]);
};
