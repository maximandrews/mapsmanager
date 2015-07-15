/* ========================================================================
 * Maps Manager: mapsmanager.js v0.0.1
 * https://github.com/openmania/mapsmanager/
 * ========================================================================
 * Copyright 2009-2015 Maxim Andrukhovych
 * Licensed under MIT (https://github.com/openmania/mapsmanager/LICENSE)
 * ======================================================================== */


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
