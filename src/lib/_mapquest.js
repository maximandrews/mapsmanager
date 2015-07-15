/* ========================================================================
 * Maps Manager: mapsmanager.js v0.0.1
 * https://github.com/openmania/mapsmanager/
 * ========================================================================
 * Copyright 2009-2015 Maxim Andrukhovych
 * Licensed under MIT (https://github.com/openmania/mapsmanager/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // MAPQUEST CLASS DEFINITION
  // ==============================

  function MapQuest(element, options) {
    var me                  = this

    me.$mapElement          = $(element)

    me.$canvas              = $.mapsManager.createCanvas(element)
    me.canvas               = me.$canvas.get(0)
    me.options              = $.extend({}, $.mapsManager.mapOptions, MapQuest.DEFAULTS, options)

    me.map                  = null
    me.$map                 = null

    me.allMarkers           = {}
    me.freeMarkers          = []
    me.mapMarkers           = []

    me.options.autoSetup && me.setupMap()
  }

  MapQuest.VERSION  = '0.0.1'

  MapQuest.DEFAULTS = {
    mapIcon       :         '/i/mapquest35.png',
    autoSetup     :         true
  }

  var methods = {
    loadScript: function () {
      var me                        = this
      var deferred                  = $.Deferred()

      if (!$.isArray(window.mapQuestMaps)) window.mapQuestMaps = []

      window.mapQuestMaps.push($.proxy(deferred.resolve, deferred))

      me.mapQuestScript             = me.mapQuestScript || false

      if (me.mapQuestScript === false) {
        me.mapQuestScript           = true

        window.mapQuestMapsInit = function () {
          for (var i = 0; i < window.mapQuestMaps.length; i++) {
            window.mapQuestMaps[i]()
          }

          window.mapQuestMaps = []
        }

        var mapQuestKey             = me.$mapElement.data('mapquestkey')

        $.getScript('http://open.mapquestapi.com/sdk/js/v7.2.s/mqa.toolkit.js?key=' + mapQuestKey, window.mapQuestMapsInit)
      }

      return deferred.promise()
    },

    setupMap: function () {
      var me                      = this

      var deferred                = $.Deferred()
      var MQAOnceEvent

      var doSetupMap              = function () {
        me.createMap()

        MQAOnceEvent = MQA.EventManager.addListener(me.map, 'zoomend', function () {
          MQA.EventManager.removeListener(me.map, 'zoomend', MQAOnceEvent, me)
          me.setupEvents()
          deferred.resolve()
        })

        if (me.options.bounds) {
          me.map.zoomToRect(
            me.options.bounds,
            false,
            MQA.MINZOOM,
            MQA.MAXZOOM
          )
        }
      }

      try {
        doSetupMap()
      } catch (e) {
        me.loadScript().done(doSetupMap)
      }

      return deferred.promise()
    },

    createMap: function () {
      var me                      = this
      var optionsMap = {
        elt         :   ['canvas',  'asis'],
        zoom        :   ['zoom',    'number', MQA.MINZOOM],
        latLng      :   ['center',  function (point) {
          var coords            = $.mapsManager.parsePoint(point)
          return { lat: coords[0], lng: coords[1] }
        }]
      }
      var mapOptions            = $.mapsManager.prepareMapOptions(me.options, optionsMap)

      me.map                    = new MQA.TileMap(mapOptions)
      me.$map                   = $(me)

      MQA.withModule('largezoom', 'viewoptions', 'geolocationcontrol', 'insetmapcontrol', 'mousewheel', function () {
        // add the Large Zoom control
        me.map.addControl(
          new MQA.LargeZoom(),
          new MQA.MapCornerPlacement(MQA.MapCorner.TOP_LEFT, new MQA.Size(5, 5))
        )

        // add the Map/Satellite toggle button
        me.map.addControl(new MQA.ViewOptions())

        // add the Geolocation button
        me.map.addControl(
          new MQA.GeolocationControl(),
          new MQA.MapCornerPlacement(MQA.MapCorner.TOP_RIGHT, new MQA.Size(10, 50))
        )

        // add the small Inset Map with custom options
        me.map.addControl(
          new MQA.InsetMapControl({
            size: { width: 150, height: 125 },
            zoom: 3,
            mapType: 'map',
            minimized: true
          }),
          new MQA.MapCornerPlacement(MQA.MapCorner.BOTTOM_RIGHT)
        )

        // enable zooming with your mouse
        me.map.enableMouseWheelZoom()
      })
    },

    setupEvents: function () {
      this.bindEvents('zoomend', 'map.zoomchange')
      this.bindEvents('moveend', 'map.boundschange')
    },

    bindEvents: function (mapEvent, mapsManagerEvent) {
      var me                      = this

      MQA.EventManager.addListener(me.map, mapEvent, function () {
        me.$map.trigger(mapsManagerEvent)
      })
    },

    getZoom: function () {
      return this.map.getZoomLevel()
    },

    getBounds: function () {
      var bounds                  = this.map.getBounds(0, 0)

      return $.extend({}, $.fn.mapsmanager.Constructor.BOUNDS, {
        sw: {
          lat: bounds.lr.getLatitude(),
          lng: bounds.ul.getLongitude()
        },
        ne: {
          lat: bounds.ul.getLatitude(),
          lng: bounds.lr.getLongitude()
        }
      })
    },

    getCenterZoom: function () {
      var me                      = this
      var center                  = me.map.getCenter()

      return {
        lat: center.getLatitude(),
        lng: center.getLongitude(),
        zoom: me.map.getZoomLevel()
      }
    },

    setCenterZoom: function (centerZoom) {
      var me                      = this

      me.map.setCenter({ lat: centerZoom.lat, lng: centerZoom.lng }, centerZoom.zoom)
    },

    getMarker: function (marker) {
      var me                      = this

      var freeMarkers             = me.freeMarkers
      var icons                   = me.$mapElement.data('mapsmanager.mapsmanager').markerIcons
      var freeMarker              = freeMarkers.length > 0 ? freeMarkers.shift() : new MQA.Poi({ lat: marker.lat, lng: marker.lng })

      freeMarker.setIcon(new MQA.Icon(marker.icon, icons[marker.icon].width, icons[marker.icon].height))
      freeMarker.setValues ({
        draggable   :       false,
        visible     :       true,
        latLng      :       new MQA.LatLng(marker.lat, marker.lng),
        minZoomLevel:       MQA.MINZOOM,
        maxZoomLevel:       MQA.MAXZOOM
      })
      me.map.addShape(freeMarker)

      return freeMarker
    },

    hideMarker: function (marker) {
      this.map.removeShape(marker)
    }
  }

  $.mapsManager.makePlugin('mapquest', methods, MapQuest)

}(jQuery);
