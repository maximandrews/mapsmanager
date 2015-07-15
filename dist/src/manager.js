/* ========================================================================
 * Maps Manager: mapsmanager.js v0.0.1
 * https://github.com/openmania/mapsmanager/
 * ========================================================================
 * Copyright 2009-2015 Maxim Andrukhovych
 * Licensed under MIT (https://github.com/openmania/mapsmanager/LICENSE)
 * ======================================================================== */


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
