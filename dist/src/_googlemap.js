/* ========================================================================
 * Maps Manager: mapsmanager.js v0.0.1
 * https://github.com/openmania/mapsmanager/
 * ========================================================================
 * Copyright 2009-2015 Maxim Andrukhovych
 * Licensed under MIT (https://github.com/openmania/mapsmanager/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // GOOGLEMAP CLASS DEFINITION
  // ==============================

  function GoogleMap(element, options) {
    var me                  = this

    me.$mapElement          = $(element)

    me.$canvas              = $.mapsManager.createCanvas(element)
    me.canvas               = me.$canvas.get(0)
    me.options              = $.extend({}, $.mapsManager.mapOptions, GoogleMap.DEFAULTS, options)

    me.map                  = null
    me.$map                 = null

    me.allMarkers           = {}
    me.freeMarkers          = []
    me.mapMarkers           = []

    me.options.autoSetup && me.setupMap()
  }

  GoogleMap.VERSION  = '0.0.1'

  GoogleMap.DEFAULTS = {
    mapIcon       :         'i/googlemap35.png',
    autoSetup     :         true
  }

  var methods = {
    loadScript: function () {
      var deferred              = $.Deferred()

      if (!$.isArray(window.googleMaps)) window.googleMaps = []

      window.googleMaps.push($.proxy(deferred.resolve, deferred))

      var $googleScript = $('#google-script')

      if ($googleScript.length === 0) {
        window.googleMapsInit = function () {
          for (var i = 0; i < window.googleMaps.length; i++) {
            window.googleMaps[i]()
          }

          window.googleMaps       = []
        }

        var apikey                = this.options.googlemapkey

        $googleScript = $('<script></script>')
          .attr('id', 'google-script')
          .attr('src', 'http://maps.googleapis.com/maps/api/js?v=3.19&sensor=false&callback=googleMapsInit&language=en' + (apikey ? '&key=' + apikey : ''))

        $('body').append($googleScript)
      }

      return deferred.promise()
    },

    setupMap: function () {
      var me                      = this
      var deferred                = $.Deferred()

      var doSetupMap = function () {
        me.createMap()
        me.setupEvents()

        google.maps.event.addListenerOnce(me.map, 'idle', $.proxy(deferred.resolve, deferred))
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
        zoom        : ['zoom',    'number'],
        center      : ['center',  function (point) {
          var coords              = $.mapsManager.parsePoint(point)
          return new google.maps.LatLng(coords[0], coords[1])
        }]
      }
      var mapOptions              = $.mapsManager.prepareMapOptions(me.options, optionsMap)

      me.map                      = new google.maps.Map(me.canvas, mapOptions)
      me.$map                     = $(me)
    },

    setupEvents: function () {
      this.bindEvents('idle',         'map.boundschange')
      this.bindEvents('zoom_changed', 'map.changezoom')
    },

    bindEvents: function (mapEvent, mapsManagerEvent) {
      var me                            = this

      google.maps.event.addListener(me.map, mapEvent, function () {
        me.$map.trigger(mapsManagerEvent)
      })
    },

    getZoom: function () {
      return this.map.getZoom()
    },

    getBounds: function (customBounds) {
      var bounds                  = customBounds || this.map.getBounds()
      var southWest               = bounds.getSouthWest()
      var northEast               = bounds.getNorthEast()

      return $.extend({}, $.fn.mapsmanager.Constructor.BOUNDS, {
        sw: {
          lat: southWest.lat(),
          lng: southWest.lng()
        },
        ne: {
          lat: northEast.lat(),
          lng: northEast.lng()
        }
      })
    },

    getCenterZoom: function () {
      var me                      = this
      var center                  = me.map.getCenter()

      return {
        lat: center.lat(),
        lng: center.lng(),
        zoom: me.map.getZoom()
      }
    },

    setCenterZoom: function (centerZoom) {
      var me                      = this

      me.map.setZoom(centerZoom.zoom)
      me.map.setCenter({ lat: centerZoom.lat, lng: centerZoom.lng })
      me.$map.trigger('map.boundschange')
    },

    getMarker: function (marker) {
      var me                      = this
      var freeMarker              = me.freeMarkers.length > 0 ? me.freeMarkers.shift() : new google.maps.Marker()

      freeMarker.setOptions({
        clickable     :     false,
        icon          :     marker.icon,
        position      :     new google.maps.LatLng(marker.lat, marker.lng),
        visible       :     true,
        map           :     me.map
      })

      return freeMarker
    },

    hideMarker: function (marker) {
      marker.setMap(null)
    }
  }

  $.mapsManager.makePlugin('googlemap', methods, GoogleMap)

}(jQuery);
