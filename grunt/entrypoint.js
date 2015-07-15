/*
 * grunt-contrib-entrypoint
 * http://gruntjs.com/
 *
 * Copyright (c) 2015 "MaxStorm" Maxim Andrukhovych
 * Licensed under the MIT license.
 */
 
'use strict';

var path = require('path')

module.exports = function(grunt) {

  grunt.registerMultiTask('entrypoint', 'Create entry point "main" file for npm package with multiple files', function() {
    var options = this.options({
      banner: ''
    })

    var banner                  = options.banner.replace(/\r\n/g, '\n')

    this.files.forEach(function (f) {
      var output                = banner + '\n'
      var dest                  = path.dirname(f.dest)

      f.src.forEach(function (s) {
        output                 += 'require(\'' + path.relative(dest, s).replace(/\\/g, '/') + '\')\n'
      })

      grunt.file.write(f.dest, output)
    })
  })
}
