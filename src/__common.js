/* ========================================================================
 * Maps Manager: mapsmanager.js v0.0.1
 * https://github.com/openmania/mapsmanager/
 * ========================================================================
 * Copyright 2009-2015 Maxim Andrukhovych
 * Licensed under MIT (https://github.com/openmania/mapsmanager/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // PRIVATE VARIABLES
  // =================
  var mapsRegistry                    = []

  // MAPSMANAGER COMMON OBJECT DEFINITION
  // ======================================
  if ($.mapsManager) {
    console.log('Namespace mapsManager already in use')
  }

  $.mapsManager = {
    mapOptions: {
      center: '54.79257, -4.25293',
      zoom: 6
    },

    prepareMapOptions: function (options, optionsMap) {
      var mapOptions                = {}

      var optionName
      var optionValue
      var formattedValue

      var formatterType
      var valueType
      var formatter

      for (var option in optionsMap) {
        optionName                  = optionsMap[option][0]
        optionValue                 = options[optionName]

        valueType                   = $.type(optionValue)
        formatter                   = optionsMap[option][1]
        formatterType               = $.type(formatter)

        if (valueType != 'undefined' && formatterType == 'string') {
          switch (formatter) {
            case 'string':
              mapOptions[option]    = optionValue.toString()
            break
            case 'number':
              formattedValue        = optionValue / 1

              if (!isNaN(formattedValue)) {
                mapOptions[option]  = formattedValue
              }
            break
            case 'asis':
              mapOptions[option]    = optionValue
            break
          }
        } else if (valueType != 'undefined' && formatterType == 'function') {
          formattedValue            = formatter(optionValue)

          if ($.type(formattedValue) != 'undefined') {
            mapOptions[option]      = formattedValue
          }
        }

        if ($.type(mapOptions[optionName]) == 'undefined' && optionsMap[option][2]) {
          mapOptions[option]        = optionsMap[option][2]
        }
      }

      return mapOptions
    },

    parsePoint: function (point) {
      var coords

      try {
        coords                      = $.parseJSON('[' + point + ']')
      } catch (e) {
        console.log('Error parsing map center: ')
        console.log(e)
      }

      if (!$.isArray(coords) || coords.length != 2 || $.type(coords[0]) != 'number' || $.type(coords[1]) != 'number') {
        console.log('Error parsing coordinate option: ')
        console.log('Please set coordinate correctly, for details see documentation.')
      }

      return coords
    },

    createCanvas: function (element) {
      return $('<div></div>')
              .css({ width      : '100%',
                     height     : '100%' })
              .appendTo(element)
    },

    boundsZoomLevel: function ($canvas, bounds) {
      var me                      = this

      var zoomFitLng              = me.pixelsZoom($canvas.width(),   bounds.ne.lng - bounds.sw.lng)
      var	zoomFitLat              = me.pixelsZoom($canvas.height(),  bounds.ne.lat - bounds.sw.lat)

      return Math.min(zoomFitLng, zoomFitLat)
    },

    pixelsZoom: function (pixels, angle) {
      var GLOBE_WIDTH             = 256 // a constant

      if (angle < 0) angle       += 360

      return Math.round(Math.log(pixels * 360 / angle / GLOBE_WIDTH) / Math.LN2)
    },

    makePlugin: function (pluginName, methods, ClassObject) {
      // METHODS ASSIGNMENT
      // ==================
      for (var m in methods) {
        ClassObject.prototype[m]      = methods[m]
      }


      // PLUGIN DEFINITION
      // =================
      function Plugin(option, params) {
        return this.each(function () {
          var $this   = $(this)
          var data    = $this.data('mapsmanager.' + pluginName)
          var options = typeof option == 'object' && option

          if (!data) $this.data('mapsmanager.' + pluginName, (data = new ClassObject(this, options)))
          if (typeof option == 'string') data[option](params)
        })
      }


      // REGISTER MAP API
      // ================
      if (typeof ClassObject.DEFAULTS.mapIcon == 'string') {
        mapsRegistry.push({ name        : pluginName,
                            plugin      : Plugin,
                            classObject : ClassObject })
      }

      var old                         = $.fn[pluginName]

      $.fn[pluginName]                = Plugin
      $.fn[pluginName].Constructor    = ClassObject


      // NO CONFLICT
      // ===========
      $.fn[pluginName].noConflict     = function () {
        $.fn[pluginName]              = old
        return this
      }

      // DATA-API
      // ========
      if (pluginName == 'mapsmanager') {
        $(window).on('load.geo.mapsmanager.data-api', function () {
          $('[data-mapsmanager]').each(function () {
            var $element                = $(this)
            Plugin.call($element, $element.data())
          })
        })
      }
    },

    registredMaps: function () {
      return mapsRegistry
    },

    registredMapsNames: function () {
      var mapsNames                   = []

      for (var i = 0; i < mapsRegistry.length; i++) {
        mapsNames.push(mapsRegistry[i].name)
      }

      return mapsNames
    }
  }

}(jQuery);
