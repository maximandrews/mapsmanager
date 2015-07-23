/*
 * grunt-contrib-inject
 * http://gruntjs.com/
 *
 * Copyright (c) 2015 Maxim Andrukhovych
 * Licensed under the MIT license.
 */
 
'use strict';

var path                        = require('path')
var glob                        = require('glob')

module.exports = function(grunt) {
  grunt.file.defaultEncoding    = 'utf8'
  grunt.file.preserveBOM        = false

  grunt.registerMultiTask('inject', 'Inject multiple files', function() {
    var options                 = this.options({
      pattern: '(([\\t ]*)<!--\\s*inject:{{type}}\\s*(\\S*)\\s*-->)(\\r|\\n|.)*?(<!--\\s*endinject\\s*-->)',
    })
    var dests

    var i

    this.files.forEach(function (f) {
      var pattern               = new RegExp(options.pattern.replace('{{type}}', f.type), 'gi')
      var replacement           = ''
      var output

      for (i = 0; i < f.src.length; i++) {
        replacement            += '{{originalSpaces}}' + f.template.replace('{{filePath}}', f.src[i]) + '\n'
      }

      dests                     = glob.sync(f.dest, { realpath: true })

      for (i = 0; i < dests.length; i++) {
        output                  = grunt.file.read(dests[i])

        grunt.file.write(dests[i], output.replace(pattern, function (match, startBlock, spaces, scriptName, oldStuff, endBlock, offset, string) {
          return startBlock + '\n' +
                 replacement.replace(/{{originalSpaces}}/g, spaces) +
                 spaces + endBlock
        }))
      }
    })
  })
}
