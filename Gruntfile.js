'use strict';

module.exports = function(grunt) {

  var bower                     = grunt.file.readJSON('bower.json')
  var pgs                       = grunt.file.readYAML('_config.yml')

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    pgs: pgs,
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
        src: [ 'src/*.js', 'docs/js/*.js' ]
      },
      lib: {
        options: { jshintrc: 'src/.jshintrc' },
        src: 'src/*.js'
      },
      docs: {
        options: { jshintrc: 'src/.jshintrc' },
        src: 'docs/js/*.js'
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
        force: true,
        src: 'dist'
      },
      ghpages: {
        force: true,
        src: [ '<%= pgs.destination %>/*', '!.git' ]
      },
      tmp: {
        force: true,
        src: [ '.tmp', '.sass-cache', '.ghpages' ]
      },
      css: {
        src: '<%= pgs.destination %>/css/main.css'
      }
    },

    copy: {
      lib: {
        expand: true,
        cwd: 'src/',
        src: '*.js',
        dest: 'dist/src/'
      },
      docs: {
        expand: true,
        cwd: 'docs/',
        src: [ '**', '!js/docs.js' ],
        dest: '.ghpages/'
      }
    },

    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      lib: {
        src: '<%= copy.lib.dist %>/**.js',
        dest: 'dist/<%= pkg.name %>.js'
      }
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
        src: '<%= copy.lib.dest %>/**.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },

    // Add vendor prefixed styles
    autoprefixer: {
      options: {
        browsers: ['last 1 version'],
        map: true
      },
      dev: {
        files: [{
          expand: true,
          cwd: '.tmp/css/',
          src: '{,*/}*.css',
          dest: '.tmp/css/'
        }]
      },
      docs: {
        files: [{
          expand: true,
          cwd: '<%= pgs.destination %>/css/',
          src: '{,*/}*.css',
          dest: '<%= pgs.destination %>/css/'
        }]
      }
    },

    // Renames files for browser caching purposes
    filerev: {
      dist: {
        src: [
          '<%= pgs.destination %>/js/{,*/}*.js',
          '<%= pgs.destination %>/css/{,*/}*.css',
          '<%= pgs.destination %>/i/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      html: [ 'docs/_includes/head.html', 'docs/_includes/footer.html' ],
      options: {
        dest: 'gh-pages/',
        flow: {
          html: {
            steps: {
              js: [ 'concat', 'uglifyjs' ],
              css: [ 'cssmin' ]
            },
            post: {}
          }
        }
      }
    },

    usemin: {
      html: [ '<%= pgs.destination %>/{,*/}*.html'    ],
      css:  [ '<%= pgs.destination %>/css/{,*/}*.css' ],
      js:   [ '<%= pgs.destination %>/js/{,*/}*.js'   ],
      options: {
        assetsDirs: [
          '<%= pgs.destination %>/',
          '<%= pgs.destination %>/i',
          '<%= pgs.destination %>/js',
          '<%= pgs.destination %>/css'
        ],
        patterns: {
          js: [[/\'(i\/[^''""]*\.(png|jpg|jpeg|gif|webp|svg))\'/g, 'Replacing references to images', null, function (file) {
            return pgs.url + '/' + file;
          }],[/\"(i\/[^''""]*\.(png|jpg|jpeg|gif|webp|svg))\"/g, 'Replacing references to images', null, function (file) {
            return pgs.url + '/' + file;
          }]],
          css: [[/(i\/[^''""]*\.(png|jpg|jpeg|gif|webp|svg))/g, 'Replacing references to images', null, function (file) {
            return pgs.url + '/' + file;
          }]],
          html: [[/\"((i|css|js)\/[^''""]*\.(png|jpg|jpeg|gif|webp|svg|css|js|json))\"/g, 'Replacing references to assets', null, function (file) {
            return pgs.url + '/' + file;
          }]]
        },
        blockReplacements: {
          cdnjquery: function (block) {
            return '<script src="https://ajax.googleapis.com/ajax/libs/jquery/' + bower.dependencies.jquery + '/jquery.min.js"></script>';
          }
        }
      }
    },

    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= pgs.destination %>/i',
          src: '{,*/}*.{png,jpg,jpeg,gif}',
          dest: '<%= pgs.destination %>/i'
        }]
      }
    },

    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= imagemin.dist.dest %>',
          src: '{,*/}*.svg',
          dest: '<%= imagemin.dist.dest %>'
        }]
      }
    },

    htmlmin: {
      docs: {
        options: {
          removeComments: true,
          collapseWhitespace: true,
          conservativeCollapse: true,
          collapseBooleanAttributes: true,
          removeCommentsFromCDATA: true
        },
        files: [{
          expand: true,
          cwd: '<%= pgs.destination %>/',
          src: '{,*/}*.html',
          dest: '<%= pgs.destination %>/'
        }]
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
        src: ['**', '!**/*.zip']
      }
    },

    jekyll: {
      build: {
        options: {
          config: '_config.yml',
          raw:  'source: .ghpages\n'
        }
      },
      dev: {
        options: {
          config: '_config.yml',
          raw:  'destination: .tmp\n' +
                'url: \n\n'
        }
      }
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
              connect().use('/bower_components', connect.static('./bower_components')),
              connect().use('/src', connect.static('./src')),
              connect.static('.tmp')
            ];
          }
        }
      }
    },

    // Automatically inject Bower components into the HTML file
    wiredep: {
      docs: {
        src: [ 'docs/_includes/**.html' ],
        fileTypes: {
          html: {
            replace: {
              js: function (filePath) {
                return '<script src="' + filePath.replace('../../', '') + '"></script>';
              }
            }
          }
        }
      }
    },

    inject: {
      docs: {
        src: 'src/**.js',
        dest: 'docs/_includes/**.html',
        type: 'mapsmanager',
        template: '<script src="{{filePath}}"></script>'
      }
    },

    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: [ 'jshint:gruntfile' ]
      },
      lib: {
        files: [ 'src/**.js' ],
        tasks: [ 'jshint:lib', 'jscs:lib' ]
      },
      docs: {
        options: { livereload: '<%= connect.options.livereload %>' },
        files: [ 'docs/**/**', '_config.yml' ],
        tasks: [ 'jshint:docs', 'jscs:docs', 'jekyll:dev', 'autoprefixer:dev' ]
      }
    },

    exec: {
      gitpush: {
        cwd: '<%= pgs.destination %>/',
        cmd: 'git pull origin gh-pages && git add -A && git commit -am "yet another documentation update" && git push origin gh-pages'
      }
    },

    qunit: {
      files: [ 'test/**/*.html' ]
    }
  });

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);
  grunt.loadTasks('grunt');
  require('time-grunt')(grunt);

  // dev
  // build (lib)
  // publish (docs)

  // Default task.
  grunt.registerTask('dev', [
    'jshint:core',
    'jscs:core',
    'clean:tmp',
    'wiredep',
    'inject',
    'jekyll:dev',
    'autoprefixer:dev',
    'connect',
    'watch'
  ]);

  grunt.registerTask('build', [
    'jshint:lib',
    'jscs:lib',
    'clean:lib',
    'concat:lib',
    'copy',
    'uglify:lib'
  ]);

  grunt.registerTask('publish', [
    'clean:tmp',
    'clean:ghpages',
    'jshint:docs',
    'jscs:docs',
    'wiredep',
    'inject',
    'copy:docs',
    'useminPrepare',
    'jekyll:build',
    'concat',
    'uglify',
    'autoprefixer:docs',
    'cssmin',
    'clean:css',
    'imagemin',
    'svgmin',
    'filerev',
    'usemin',
    'htmlmin',
    'clean:tmp',
    'exec'
  ]);
};
