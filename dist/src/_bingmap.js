/* ========================================================================
 * Maps Manager: mapsmanager.js v0.0.1
 * https://github.com/openmania/mapsmanager/
 * ========================================================================
 * Copyright 2009-2015 Maxim Andrukhovych
 * Licensed under MIT (https://github.com/openmania/mapsmanager/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // BINGMAP CLASS DEFINITION
  // ==============================

  function BingMap(element, options) {
    var me                  = this

    me.$mapElement          = $(element)

    me.$canvas              = $.mapsManager.createCanvas(element)
    me.canvas               = me.$canvas.get(0)
    me.options              = $.extend({}, $.mapsManager.mapOptions, BingMap.DEFAULTS, options)

    me.map                  = null
    me.$map                 = null

    me.allMarkers           = {}
    me.freeMarkers          = []
    me.mapMarkers           = []

    me.options.autoSetup && me.setupMap()
  }

  BingMap.VERSION  = '0.0.1'

  BingMap.DEFAULTS = {
    mapIcon       :         'i/bingmap35.png',
    autoSetup     :         true
  }

  var methods = {
    loadScript: function () {
      var deferred                = $.Deferred()

      if (!$.isArray(window.bingMaps)) window.bingMaps = []

      window.bingMaps.push($.proxy(deferred.resolve, deferred))

      var $bingScript = $('#bing-script')

      if ($bingScript.length === 0) {
        window.bingMapsInit = function () {
          for (var i = 0; i < window.bingMaps.length; i++) {
            window.bingMaps[i]()
          }

          window.bingMaps = []
        }

        $bingScript = $('<script></script>')
          .attr('id', 'bing-script')
          .attr('charset', 'UTF-8')
          .attr('src', 'http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0&mkt=en-US,ngt&onScriptLoad=bingMapsInit')

        $('body').append($bingScript)
      }

      return deferred.promise()
    },

    setupMap: function () {
      var me                      = this

      var deferred                = $.Deferred()
      var bingOnceEvent

      var doSetupMap = function () {
        me.createMap()
        bingOnceEvent = Microsoft.Maps.Events.addHandler(me.map, 'viewchangeend', function () {
          Microsoft.Maps.Events.removeHandler(bingOnceEvent)
          deferred.resolve()
          me.setupEvents()
        })
      }

      try {
        doSetupMap()
      }catch (e) {
        me.loadScript().done(doSetupMap)
      }

      return deferred.promise()
    },

    createMap: function () {
      var me                      = this
      var optionsMap = {
        credentials :   ['bingmapkey', 'string'],
        zoom        :   ['zoom',       'number'],
        center      :   ['center', function (point) {
          var coords              = $.mapsManager.parsePoint(point)
          return new Microsoft.Maps.Location(coords[0], coords[1])
        }]
      }
      var mapOptions              = $.mapsManager.prepareMapOptions(me.options, optionsMap)

      me.map                      = new Microsoft.Maps.Map(me.canvas, mapOptions)
      me.$map                     = $(me)
    },

    setupEvents: function () {
      this.bindEvents('viewchangeend', 'map.boundschange')
    },

    bindEvents: function (mapEvent, mapsManagerEvent) {
      var me                      = this

      Microsoft.Maps.Events.addHandler(me.map, mapEvent, function () {
        me.$map.trigger(mapsManagerEvent)
      })
    },

    getZoom: function () {
      return this.map.getZoom()
    },

    getBounds: function () {
      var bounds                  = this.map.getBounds()

      return $.extend({}, $.fn.mapsmanager.Constructor.BOUNDS, {
        sw: {
          lat: bounds.getSouth(),
          lng: bounds.getWest()
        },
        ne: {
          lat: bounds.getNorth(),
          lng: bounds.getEast()
        }
      })
    },

    getCenterZoom: function () {
      var me                      = this
      var center                  = me.map.getCenter()

      return {
        lat: center.latitude,
        lng: center.longitude,
        zoom: me.map.getZoom()
      }
    },

    setCenterZoom: function (centerZoom) {
      var me                      = this

      me.map.setView({
        center: new Microsoft.Maps.Location(centerZoom.lat, centerZoom.lng),
        zoom: centerZoom.zoom
      })
    },

    getMarker: function (marker) {
      var me                      = this

      var freeMarker              = me.freeMarkers.length > 0 ? me.freeMarkers.shift() : new Microsoft.Maps.Pushpin()
      var icons                   = me.$mapElement.data('mapsmanager.mapsmanager').markerIcons

      freeMarker.setLocation(new Microsoft.Maps.Location(marker.lat, marker.lng))
      freeMarker.setOptions({
        draggable   :       false,
        icon        :       marker.icon,
        visible     :       true,
        width       :       icons[marker.icon].width,
        height      :       icons[marker.icon].height
      })
      me.map.entities.push(freeMarker)

      return freeMarker
    },

    hideMarker: function (marker) {
      this.map.entities.remove(marker)
    }
  }

  $.mapsManager.makePlugin('bingmap', methods, BingMap)

}(jQuery);
