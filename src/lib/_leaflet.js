/* ========================================================================
 * Maps Manager: mapsmanager.js v0.0.1
 * https://github.com/openmania/mapsmanager/
 * ========================================================================
 * Copyright 2009-2015 Maxim Andrukhovych
 * Licensed under MIT (https://github.com/openmania/mapsmanager/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // LEAFLET CLASS DEFINITION
  // ==============================

  function LeafLet(element, options) {
    var me                  = this

    me.$mapElement          = $(element)

    me.$canvas              = $.mapsManager.createCanvas(element)
    me.canvas               = me.$canvas.get(0)
    me.options              = $.extend({}, $.mapsManager.mapOptions, LeafLet.DEFAULTS, options)

    me.map                  = null
    me.$map                 = null

    me.mapboxUrl            = 'http://api.tiles.mapbox.com/v4/{mapid}/{z}/{x}/{y}.png?access_token={token}'
    me.baseLayers           = {}
    me.allLayers            = [['Streets',     'streets-basic'],
                               ['Hybrid',      'streets-satellite'],
                               ['Satellite',   'satellite'],
                               ['Cycling',     'run-bike-hike'],
                               ['Outdoors',    'outdoors'],
                               ['Light',       'light'],
                               ['Dark',        'dark'],
                               ['Contrast',    'high-contrast'],
                               ['Pencil',      'pencil'],
                               ['Emerald',     'emerald'],
                               ['Pirates',     'pirates'],
                               ['Comic',       'comic'],
                               ['Wheatpaste',  'wheatpaste']]

    me.allMarkers           = {}
    me.freeMarkers          = []
    me.mapMarkers           = []

    me.options.autoSetup && me.setupMap()
  }

  LeafLet.VERSION  = '0.0.1'

  LeafLet.DEFAULTS = {
    mapIcon       :         '/i/mapbox35.png',
    autoSetup     :         true
  }

  var methods = {
    loadScript: function () {
      var me                      = this
      var deferred                = $.Deferred()

      if (!$.isArray(window.leafLetMaps)) window.leafLetMaps = []

      window.leafLetMaps.push($.proxy(deferred.resolve, deferred))

      me.leafletScript            = me.leafletScript || false

      if (me.leafletScript === false) {
        me.leafletScript          = true

        window.leafLetMapsInit = function () {
          for (var i = 0; i < window.leafLetMaps.length; i++) {
            window.leafLetMaps[i]()
          }

          window.leafLetMaps = []
        }

        var $leafletStyle = $('<link>')
          .attr('rel', 'stylesheet')
          .attr('href', 'https://api.tiles.mapbox.com/mapbox.js/v2.1.8/mapbox.css')

        $('head').append($leafletStyle)

        $.getScript('https://api.tiles.mapbox.com/mapbox.js/v2.1.8/mapbox.js', window.leafLetMapsInit)
      }

      return deferred.promise()
    },

    setupMap: function () {
      var me                      = this
      var deferred                = $.Deferred()

      var doSetupMap = function () {
        me.createMap()
        me.setupEvents()
        deferred.resolve()
      }

      try {
        doSetupMap()
      }catch (e) {
        me.loadScript().done(doSetupMap)
      }

      return deferred.promise()
    },

    createMap: function () {
      var me                        = this
      var optionsMap = {
        accessToken :   ['mapboxkey', 'string'],
        zoom        :   ['zoom',      'number'],
        center      :   ['center',    function (point) {
          var coords                = $.mapsManager.parsePoint(point)
          return L.latLng(coords[0], coords[1])
        }],
        layers      :   ['mapboxkey', function (accessTooken) {
          var layer

          for (var i = 0; i < me.allLayers.length; i++) {
            layer                   = me.allLayers[i]
            me.baseLayers[layer[0]] = L.tileLayer(me.mapboxUrl, { mapid: 'mapbox.' + layer[1], token: accessTooken })
          }

          return me.baseLayers[me.allLayers[0][0]]
        }]
      }
      var mapOptions                = $.mapsManager.prepareMapOptions(me.options, optionsMap)

      me.map                        = L.mapbox.map(me.canvas, me.options.mapboxmapid || 'mapbox.streets', mapOptions)
      me.$map                       = $(me)

      L.control.layers(me.baseLayers).addTo(me.map)
    },

    setupEvents: function () {
      var me                      = this

      me.bindEvents('moveend',  'map.boundschange')
      me.bindEvents('resize',   'map.boundschange')
      me.bindEvents('zoomend',  'map.changezoom')
    },

    bindEvents: function (mapEvent, mapsManagerEvent) {
      var me                      = this

      me.map.on(mapEvent, function () {
        me.$map.trigger(mapsManagerEvent)
      })
    },

    getZoom: function () {
      return this.map.getZoom()
    },

    getBounds: function () {
      var bounds                  = this.map.getBounds()
      var southWest               = bounds.getSouthWest()
      var northEast               = bounds.getNorthEast()

      return $.extend({}, $.fn.mapsmanager.Constructor.BOUNDS, {
        sw: {
          lat: southWest.lat,
          lng: southWest.lng
        },
        ne: {
          lat: northEast.lat,
          lng: northEast.lng
        }
      })
    },

    getCenterZoom: function () {
      var me          = this
      var center      = me.map.getCenter()

      return {
        lat: center.lat,
        lng: center.lng,
        zoom: me.map.getZoom()
      }
    },

    setCenterZoom: function (centerZoom) {
      var me          = this

      me.map.setView([centerZoom.lat, centerZoom.lng], centerZoom.zoom)
    },

    getMarker: function (marker) {
      var me          = this
      var freeMarker  = me.freeMarkers.length > 0 ? me.freeMarkers.shift() : L.marker([marker.lat, marker.lng],
                                                                                      { draggable: false, clickable: false, keyboard: false })
      var icons       = me.$mapElement.data('mapsmanager.mapsmanager').markerIcons

      freeMarker
        .setLatLng([marker.lat, marker.lng])
        .setIcon(L.icon({ iconUrl: marker.icon, iconSize: [icons[marker.icon].width, icons[marker.icon].height] }))
        .addTo(me.map)

      return freeMarker
    },

    hideMarker: function (marker) {
      this.map.removeLayer(marker)
    }
  }

  $.mapsManager.makePlugin('mapbox', methods, LeafLet)

}(jQuery);
