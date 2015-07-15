/*!
 * Maps Manager v1.0.0 (https://github.com/openmania/mapsmanager/)
 * 2015-07-15
 * Copyright (c) 2009-2015 Maxim Andrukhovych
 * Licensed under MIT (https://github.com/openmania/mapsmanager/blob/master/LICENSE)
 */
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
    mapIcon       :         '/i/bingmap35.png',
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
    mapIcon       :         '/i/googlemap35.png',
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

+function ($) {
  'use strict';

  // MANAGER CLASS DEFINITION
  // ==============================

  function Manager(element, options) {
    var me                  = this

    me.initialElement       = element
    me.initialOptions       = $.extend({}, $.mapsManager.mapOptions, Manager.DEFAULTS, options)
    me.$mapElement          = $(element)

    me.buttons              = []

    me.maps                 = []
    me.currentMap           = null
    me.mapsRegistry         = me.managerMaps()

    me.$canvas              = null
    me.canvas               = null
    me.options              = null

    me.map                  = null
    me.$map                 = null

    me.allMarkers           = null
    me.freeMarkers          = null
    me.mapMarkers           = null

    me.initialOptions.autoSetup && me.setupMap()
  }

  Manager.VERSION  = '0.0.1'

  Manager.DEFAULTS = {
    autoSetup       :       true
  }

  var methods = {
    managerMaps: function () {
      var me                = this

      var requestedMaps     = me.initialOptions.maps || ''
      var registredMaps     = $.mapsManager.registredMaps()
      var managerMaps       = []

      if (!requestedMaps) return registredMaps

      requestedMaps         = requestedMaps.replace(/\s+/ig, '').split(',')

      var i
      var m

      for (i = 0; i < requestedMaps.length; i++) {
        for (m = 0; m < registredMaps.length; m++) {
          if (registredMaps[m].name == requestedMaps[i]) {
            managerMaps.push(registredMaps[m])
            break
          }
        }
      }

      return managerMaps
    },

    setupMap: function () {
      var me                = this

      var map

      var $switcher         = $('<div></div>')
                                .css({ 'background-color'         :     '#fff',
                                       position                   :     'absolute',
                                       'z-index'                  :     999999,
                                       top                        :     '100%',
                                       left                       :     '10px',
                                       transform                  :     'translate(0, -81px)',
                                       width                      :     '56px',
                                       height                     :     '41px',
                                       'border-radius'            :     '6px' })
                                .appendTo(me.$mapElement)
      var $buttonHolder     = $('<div></div>')
                                .css({ width                      :     '100%',
                                       height                     :     '100%',
                                       'white-space'              :     'nowrap',
                                       overflow                   :     'hidden',
                                       'border-radius'            :     '6px' })
                                .appendTo($switcher)
      var $signifier        = $('<div>&#187;</div>')
                                .css({ 'background-color'           :     '#fff',
                                       color                        :     '#000',
                                       position                     :     'absolute',
                                       'z-index'                    :     5,
                                       'line-height'                :     '41px',
                                       'font-weight'                :     'bold',
                                       'font-size'                  :     '18px',
                                       'text-align'                 :     'center',
                                       top                          :     0,
                                       left                         :     '100%',
                                       transform                    :     'translate(-100%, 0)',
                                       width                        :     '15px',
                                       height                       :     '100%',
                                       'border-top-right-radius'    :     '6px',
                                       'border-bottom-right-radius' :     '6px' })
                                .appendTo($switcher)

      var timeout
      var action                  = false

      var selected

      function closeSwitch() {
        clearTimeout(timeout)
        if (action || switcherIsClosed()) return false
        action                    = true

        var switcher              = false
        var holder                = false

        $switcher.animate({
          width       :   ($(me.buttons[0]).outerWidth(true) + $signifier.outerWidth(true) + 3) + 'px'
        }, {
          queue       : false,
          complete    : function () {
            switcher              = true
            finishAll()
          }
        })

        $buttonHolder.animate({
          scrollLeft  :   $(selected).position().left + 'px'
        }, {
          queue       : false,
          complete    : function () {
            holder              = true
            finishAll()
          }
        })

        function finishAll () {
          if (switcher && holder) {
            $signifier.html('&#187;')
            action              = false
          }
        }
      }

      function openSwitch() {
        clearTimeout(timeout)
        if (action || !switcherIsClosed()) return false

        $switcher.animate({
          width       :   (me.buttons.length * $(me.buttons[0]).outerWidth(true) + $signifier.outerWidth(true) + 3) + 'px'
        }, 'easeOutBack', function () { $signifier.html('&#171;') })

        return true
      }

      function buttonClick() {
        /*jshint validthis:true */
        var el                    = this

        if (switcherIsClosed()) {
          openSwitch()
        } else {
          timeout                 = setTimeout(closeSwitch, 500)

          if (selected != el) {
            me.changeMap(selected = el)
          }
        }
      }

      function switcherIsClosed() {
        return $switcher.width() == $(me.buttons[0]).outerWidth(true) + $signifier.outerWidth(true) + 3
      }

      var allMaps                 = me.mapsRegistry

      for (var i = 0; i < allMaps.length; i++) {
        map                       = allMaps[i]
        me.buttons.push($('<img>')
                          .attr({ alt                    : '',
                                  src                    : map.classObject.DEFAULTS.mapIcon })
                          .css({ border                  : 'none',
                                 'border-radius'         : '6px',
                                 margin                  : '3px',
                                 'margin-right'          : i === allMaps.length - 1 ? ($signifier.outerWidth(true) + 3) + 'px' : 0,
                                 width                   : '35px',
                                 height                  : '35px',
                                 cursor                  : 'pointer' })
                          .click(buttonClick)
                          .appendTo($buttonHolder)
                          .get(0))
      }

      selected                    = me.buttons[0]

      $switcher.on('mouseover', openSwitch)

      $switcher.on('mouseout', function () {
        if (action) return false

        timeout                   = setTimeout(closeSwitch, 500)
      })

      return me.changeMap(selected)
    },

    changeMap: function (button) {
      var me                      = this
      var deferred                = $.Deferred()

      me.changingMap              = true
      var centerZoom
      var newMap                  = me.buttons.indexOf(button)

      if (me.currentMap == newMap) {
        deferred.resolve()
        return deferred.promise()
      }

      if (me.maps[me.currentMap]) {
        if (me.maps[me.currentMap].map) centerZoom = me.maps[me.currentMap].getCenterZoom()
        me.hideMap()
      }

      me.currentMap               = newMap

      function finishChange (showMap) {
        me.changeTheRest()

        if (centerZoom) me.maps[me.currentMap].setCenterZoom(centerZoom)

        if (showMap === true) me.showMap()

        me.changingMap            = false

        $(me).trigger('mapmanager.mapchange')

        deferred.resolve()
      }

      if (!me.maps[me.currentMap]) {
        var mapType               = me.mapsRegistry[me.currentMap].name

        me.$mapElement[mapType]($.extend({}, me.initialOptions, { autoSetup: false }))

        me.maps[me.currentMap]    = me.$mapElement.data('mapsmanager.' + mapType)
        var map                   = me.maps[me.currentMap]

        map.setupMap().then(function () {
          me.bindEvent(map, 'map.boundschange')
          me.bindEvent(map, 'map.zoomchange')
          finishChange()
        })
      } else {
        finishChange(true)
      }

      return deferred.promise()
    },

    changeTheRest: function () {
      var me                  = this
      var map                 = me.maps[me.currentMap]

      me.$canvas              = map.$canvas
      me.canvas               = map.canvas
      me.options              = map.options

      me.map                  = map.map
      me.$map                 = map.$map

      me.allMarkers           = map.allMarkers
      me.freeMarkers          = map.freeMarkers
      me.mapMarkers           = map.mapMarkers
    },

    bindEvent: function (map, eventName) {
      var me                  = this
      var $me                 = $(me)
      var $map                = $(map)

      $map.on(eventName, function () {
        if (me.currentMap == me.maps.indexOf(map) && !me.changingMap) $me.trigger(eventName)
      })
    },

    hideMap: function () {
      this.maps[this.currentMap].$canvas.hide()
    },

    showMap: function () {
      this.$canvas.show()
    },

    getZoom: function () {
      return this.maps[this.currentMap].getZoom()
    },

    getBounds: function () {
      return this.maps[this.currentMap].getBounds()
    },

    showMarker: function (marker) {
      return this.maps[this.currentMap].showMarker(marker)
    },

    hideMarker: function (marker) {
      return this.maps[this.currentMap].hideMarker(marker)
    },

    getMarker: function (marker) {
      return this.maps[this.currentMap].getMarker(marker)
    }
  }

  $.mapsManager.makePlugin('manager', methods, Manager)

}(jQuery);

+function ($) {
  'use strict';

  // MAPSMANAGER CLASS DEFINITION
  // ==============================

  function MapsManager(element, options) {
    var me                  = this

    me.$mapElement        = $(element)
    me.options            = $.extend({}, $.mapsManager.mapOptions, MapsManager.DEFAULTS, options)

    me.map                = null
    me.$map               = null

    me.markerReference    = {}                                // all marker object references
    me.allMarkers         = []                                // all map markers

    me.hiddenMarkers      = []                                // all still hidden map markers
    me.showenMarkers      = []                                // all ever showen markers

    me.levelShowen        = []                                // all ever showen markers by zoom level
    me.currentMarkers     = []                                // currently displayed markers

    me.zoom               = null                              // current zoom level

    // Applies if Marker Manager loads markers dynamically
    me.markersFeed        = me.options.feed || null           // markers data feed
    me.discoveredAreas    = []                                // discovered marker areas

    me.markerSpace        = me.options.space || 1             // multiplier of space should be left around each marker

    me.mapRows            = 0                                 // markers grid rows count will be displayed on the map
    me.mapCols            = 0                                 // markers grid columns count will be displayed on the map

    me.markerIcons        = {}                                // all loaded marker icons
    me.maxIconWidth       = 0                                 // defined automatically loading icons
    me.maxIconHeight      = 0                                 // defined automatically loading icons

    me.latPixel           = 0                                 // map area size in pixels
    me.lngPixel           = 0                                 // map area size in grads

    me.setupMap()
  }

  MapsManager.VERSION  = '0.0.1'

  MapsManager.DEFAULTS = {
    'marker-icon': '/i/defaultIcon.png'
  }

  MapsManager.POINT = {
    lat: 0,
    lng: 0,
    toString: function () {
      return this.lat.toFixed(6) + ',' + this.lng.toFixed(6)
    }
  }

  MapsManager.MARKER = $.extend({
    icon: null
  }, MapsManager.POINT)

  MapsManager.BOUNDS = {
    sw: $.extend({}, MapsManager.POINT),
    ne: $.extend({}, MapsManager.POINT),
    toString: function () {
      return this.sw.toString() + ',' + this.ne.toString()
    }
  }

  var methods = {
    setupMap: function () {
      var me                      = this
      var deferred                = $.Deferred()

      var defaultMapType          = me.options.mapsmanager
      var registredMaps           = $.mapsManager.registredMapsNames()
      var mapType                 = registredMaps.indexOf(defaultMapType) == -1 ? 'manager' : defaultMapType

      me.$mapElement.css({ position: 'relative' })

      me.$mapElement[mapType]($.extend({}, me.options, { autoSetup: false }))

      me.map                      = me.$mapElement.data('mapsmanager.' + mapType)
      me.$map                     = $(me.map)

      var done = function () {
        me.changeZoom()
        deferred.resolve()
      }

      me.map.setupMap().then(function () {
        me.setupEvents()
        if (me.options.feedonce) {
          me.loadMarkersUrl(me.options.feedonce)
            .done(done)
        } else {
          done()
        }
      })

      return deferred.promise()
    },

    setupEvents: function () {
      var me                      = this
      var $map                    = me.$map

      $map.on('map.boundschange',      me.mapEvent(function () { if (!me.changeZoom()) me.canvasChange() }))
      $map.on('map.zoomchange',        me.mapEvent(me.changeZoom))
      $map.on('mapmanager.mapchange',  me.mapEvent(me.syncMarkers))
    },

    mapEvent: function (method) {
      var me                      = this

      return function () { me.loadMarkers().done($.proxy(method, me)) }
    },

    refresh: function () {
      var me                      = this

      me.cleanMarkers()
      me.showMarkers()
      // me.showConflicts()

      return true
    },

    cleanMarkers: function () {
      var me                      = this
      var mapBounds               = me.map.getBounds()
      var currentLevel            = me.levelShowen[me.zoom]

      var i
      var marker
      var absent

      for (i = 0; i < me.currentMarkers.length; i++) {
        marker                    = me.currentMarkers[i]
        absent                    = currentLevel.indexOf(marker) == -1

        if (absent && me.markerConflict(marker, currentLevel) || !me.markerResidesArea(marker, mapBounds)) {
          me.hideMarker(marker) && i--
        } else if (absent) {
          me.showMarker(marker)
        }
      }
    },

    showMarkers: function () {
      var me                      = this

      var levelMarkers            = me.levelShowen
      var allShowen               = me.showenMarkers
      var allHidden               = me.hiddenMarkers

      var zoom                    = me.zoom
      var cellBounds

      for (var row = 0; row < me.mapRows; row++) {
        for (var col = 0; col < me.mapCols; col++) {
          cellBounds              = me.cellBounds(row, col)

          $.isArray(levelMarkers[zoom]) && levelMarkers[zoom].length > 0 && me.selectMarker(cellBounds, levelMarkers[zoom]) ||
            allShowen.length > 0 && me.selectMarker(cellBounds, allShowen) ||
            allHidden.length > 0 && me.selectMarker(cellBounds, allHidden)
        }
      }
    },

    canvasChange: function () {
      this.calculateColsRows()

      return this.refresh()
    },

    calculateColsRows: function () {
      var me                    = this

      var size                  = me.canvasSize()
      var maxWidth              = me.maxIconWidth
      var maxHeight             = me.maxIconHeight

      me.mapCols                = maxWidth  ? Math.ceil(size.width  / maxWidth)   : 0
      me.mapRows                = maxHeight ? Math.ceil(size.height / maxHeight)  : 0
    },

    canvasSize: function () {
      var $canvas               = this.map.$canvas

      return {
        width: $canvas.width(),
        height: $canvas.height()
      }
    },

    changeZoom: function () {
      var me                   = this
      var zoom                 = me.map.getZoom()

      if (zoom == me.zoom) return false

      me.setGradsPixelRatio()

      me.zoom                  = zoom

      me.levelShowen[zoom] == null && (me.levelShowen[zoom] = [])

      return me.refresh()
    },

    setGradsPixelRatio: function () {
      var me                      = this
      var mapSize                 = me.canvasSize()
      var mapBounds               = me.map.getBounds()

      me.latPixel                 = (mapBounds.ne.lat - mapBounds.sw.lat) / mapSize.height
      me.lngPixel                 = (mapBounds.ne.lng - mapBounds.sw.lng) / mapSize.width
    },

    loadIcon: function (iconPath) {
      var me                      = this
      var deferred                = $.Deferred()

      if (me.markerIcons[iconPath]) {
        deferred.resolve()
        return deferred.promise()
      }

      var image                   = new Image()
      var $image                  = $(image)
      me.markerIcons[iconPath]    = image

      $image.one('load', function () {
        var width                 = image.width
        var height                = image.height

        if (me.maxIconWidth < width) me.maxIconWidth = width
        if (me.maxIconHeight < height) me.maxIconHeight = height

        deferred.resolve()
      }).one('error', function () {
        // TO DO
        console.log('Couldn\'t load ' + iconPath)
        deferred.reject()
      })

      image.src = iconPath

      return deferred.promise()
    },

    cellBounds: function (row, col) {
      var me                      = this
      var bounds                  = me.map.getBounds()
      var markerSize              = me.markerSize()

      var width                   = markerSize.width
      var height                  = markerSize.height

      return $.extend({}, MapsManager.BOUNDS, {
        sw: {
          lat: bounds.sw.lat + height * row,
          lng: bounds.sw.lng + width * col
        },
        ne: {
          lat: me.mapRows == row + 1 ? bounds.ne.lat : bounds.sw.lat + height * (row + 1),
          lng: me.mapRows == col + 1 ? bounds.ne.lng : bounds.sw.lng + width * (col + 1)
        }
      })
    },

    selectMarker: function (area, markersArray) {
      var me                      = this
      var currentLevel            = me.levelShowen[me.zoom]
      var marker

      for (var i = 0; i < markersArray.length; i++) {
        marker = markersArray[i]

        if (me.markerResidesArea(marker, area) &&
            (currentLevel && currentLevel.indexOf(marker) > -1 || !me.markerConflict(marker, currentLevel))) {
          return me.showMarker(marker)
        }
      }

      return false
    },

    markerResidesArea: function (marker, area) {
      return area.sw.lat < marker.lat &&
             area.ne.lat > marker.lat &&
             area.sw.lng < marker.lng &&
             area.ne.lng > marker.lng
    },

    markerConflict: function (marker, markersArray, debug) {
      if (!$.isArray(markersArray) || markersArray.length === 0) {
        return false
      }

      var me                      = this
      var markerBounds            = me.markerBounds(marker)
      var checkBounds

      for (var i = 0; i < markersArray.length; i++) {
        if (marker == markersArray[i]) continue // skip self comparision

        checkBounds               = me.markerBounds(markersArray[i])

        if (me.areaConflict(markerBounds, checkBounds)) {
          if (debug) console.log(marker.toString() + ' ? ' + markersArray[i].toString())

          return true
        }
      }

      return false
    },

    markerBounds: function (marker) {
      var me                      = this
      var markerSize              = me.markerSize(marker)

      var space                   = markerSize.height * me.markerSpace
      var halfWidth               = markerSize.width / 2 + space

      return $.extend({}, MapsManager.BOUNDS, {
        sw: {
          lat: marker.lat - space,
          lng: marker.lng - halfWidth
        },
        ne: {
          lat: marker.lat + markerSize.height + space,
          lng: marker.lng + halfWidth
        }
      })
    },

    markerSize: function (marker) {
      var me                      = this
      var icon

      var sizes = marker &&
        marker.icon &&
        (icon = me.markerIcons[marker.icon]) && {
          width: icon.width,
          height: icon.height
        } || {
          width: me.maxIconWidth,
          height: me.maxIconHeight
        }

      return {
        width: me.lngPixel * sizes.width,
        height: me.latPixel * sizes.height
      }
    },

    areaConflict: function (area, check) {
      return (
        check.sw.lat <= area.sw.lat && check.ne.lat >= area.sw.lat && check.sw.lng <= area.sw.lng && check.ne.lng >= area.sw.lng ||
        check.sw.lat <= area.sw.lat && check.ne.lat >= area.sw.lat && check.sw.lng <= area.ne.lng && check.ne.lng >= area.ne.lng ||
        check.sw.lat <= area.ne.lat && check.ne.lat >= area.ne.lat && check.sw.lng <= area.sw.lng && check.ne.lng >= area.sw.lng ||
        check.sw.lat <= area.ne.lat && check.ne.lat >= area.ne.lat && check.sw.lng <= area.ne.lng && check.ne.lng >= area.ne.lng
      )
    },

    showMarker: function (marker) {
      var me                        = this

      if (!marker || !marker.lat || !marker.lng || !marker.icon || me.allMarkers.indexOf(marker) == -1) {
        console.log('Bad marker:')
        console.log(marker)
        return false
      }

      var idString                  = marker.toString()
      var allMarkers                = me.map.allMarkers

      if (!allMarkers[idString]) {
        allMarkers[idString]          = me.map.getMarker(marker)
        me.map.mapMarkers.push(allMarkers[idString])
      }

      me.showenMarkers.indexOf(marker) == -1 && me.showenMarkers.push(marker)
      me.currentMarkers.indexOf(marker) == -1 && me.currentMarkers.push(marker)
      me.levelShowen[me.zoom].indexOf(marker) == -1 && me.levelShowen[me.zoom].push(marker)

      var index

      if ((index = me.hiddenMarkers.indexOf(marker)) > -1) me.hiddenMarkers.splice(index, 1)

      return true
    },

    hideMarker: function (marker) {
      var me                      = this

      if (!marker || !marker.lat || !marker.lng || !marker.icon || me.allMarkers.indexOf(marker) == -1) {
        return false
      }

      var idString                = marker.toString()
      var allMarkers              = me.map.allMarkers
      var mapMarkers              = me.map.mapMarkers

      var index

      if (allMarkers[idString]) {
        me.map.hideMarker(allMarkers[idString])

        index                     = mapMarkers.indexOf(allMarkers[idString])

        me.map.freeMarkers.push(mapMarkers.splice(index, 1).shift())

        allMarkers[idString]      = false
      }

      if ((index = me.currentMarkers.indexOf(marker)) > -1) me.currentMarkers.splice(index, 1)

      return true
    },

    areaDiscovered: function (area) {
      var me                      = this

      for (var i = 0; i < me.discoveredAreas.length; i++) {
        if (me.areaResidesArea(area, me.discoveredAreas[i])) {
          return true
        }
      }

      return false
    },

    areaResidesArea: function (check, area) {
      return area.sw.lat <= check.sw.lat &&
             area.ne.lat >= check.ne.lat &&
             check.ne.lat >= check.sw.lat &&
             area.sw.lng <= check.sw.lng &&
             area.ne.lng >= check.ne.lng &&
             check.ne.lng >= check.sw.lng
    },

    saveArea: function (area) {
      var me                      = this
      var discovered

      for (var i = 0; i < me.discoveredAreas.length; i++) {
        discovered                = me.discoveredAreas[i]

        if (me.areaResidesArea(discovered, area)) {
          me.discoveredAreas.splice(i, 1) && i--
        }
      }

      me.discoveredAreas.push(area)
    },

    loadMarkers: function () {
      var me                      = this
      var deferred                = $.Deferred()
      var urlTemplate             = me.markersFeed

      var mapBounds               = me.map.getBounds()
      var boundsString            = mapBounds.toString()
      var url

      if (urlTemplate == null || me.areaDiscovered(mapBounds)) {
        deferred.resolve()
        return deferred.promise()
      }

      urlTemplate.indexOf('$bounds') > -1 && (url = urlTemplate.replace('$bounds', boundsString)) ||
      (url = urlTemplate + boundsString)

      me.loadMarkersUrl(url)
        .done(function () {
          me.saveArea(mapBounds)
          deferred.resolve()
        })

      return deferred.promise()
    },

    loadMarkersUrl: function (url) {
      var me                      = this
      var deferred                = $.Deferred()

      $.get(url, function (markers) {
        me.saveMarkers(markers)
          .done(function () {
            me.calculateColsRows()
            deferred.resolve()
          })
      })
        .fail(function () {
          deferred.resolve()
        })

      return deferred.promise()
    },

    saveMarkers: function (markers) {
      var me                      = this

      var deferred                = $.Deferred()
      var marker
      var markerId

      var iconsLoaded             = 0
      var defaultIcon             = me.options['marker-icon']
      var done                    = false

      var i                       = 0

      var markerDone = function () {
        iconsLoaded++
        done && i == iconsLoaded && deferred.resolve()
      }

      var markerFail = function () {
        me.icon                   = defaultIcon
        markerDone()
      }

      for (; i < markers.length; i++) {
        marker = $.extend({}, MapsManager.MARKER, {
          lat: markers[i][0],
          lng: markers[i][1],
          icon: markers[i][2] ? markers[i][2] : defaultIcon
        })

        markerId                  = marker.toString()

        if (me.markerReference[markerId] != null) continue

        me.loadIcon(marker.icon)
          .done(markerDone)
          .fail($.proxy(markerFail, marker))

        me.markerReference[markerId] = marker
        me.allMarkers.push(marker)
        me.hiddenMarkers.push(marker)
      }

      done                        = true

      return deferred.promise()
    },

    syncMarkers: function () {
      var me                      = this

      var mapMarkers              = me.map.mapMarkers
      var allMapMarkers           = me.map.allMarkers
      var managerMarkers          = me.currentMarkers

      var synced                  = []
      var marker
      var idString

      var mapMarker
      var i

      for (i = 0; i < managerMarkers.length; i++) {
        marker                    = managerMarkers[i]
        idString                  = marker.toString()
        mapMarker                 = allMapMarkers[idString]

        if (mapMarker && mapMarkers.indexOf(mapMarker) > -1) synced.push(mapMarker)
      }

      for (i = 0; i < mapMarkers.length; i++) {
        if (synced.indexOf(mapMarkers[i]) == -1) {
          me.map.hideMarker(mapMarkers[i])

          me.map.freeMarkers.push(mapMarkers.splice(i, 1).shift())
          i--
        }
      }

      for (idString in allMapMarkers) {
        if (mapMarkers.indexOf(allMapMarkers[idString]) == -1) allMapMarkers[idString] = false
      }

      me.refresh()
    }
  }

  $.mapsManager.makePlugin('mapsmanager', methods, MapsManager)
}(jQuery);
