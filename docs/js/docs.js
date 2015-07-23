$(function () {
  'use strict';

  var allMaps                   = $('[data-mapsmanager]')
  allMaps.data('bingmapkey',    ['AhbY6YeowkXz1', 'ljukcuAt5A_prNaaADXcUJ_Wa',    'IRgKBkKNCO6uOVo7CJHQsG-T9m'].join(''))
  allMaps.data('mapquestkey',   ['Fmjtd%7Cl',     'uu82qu820%2C',                 '7x%3Do5-94ta00'].join(''))
  allMaps.data('mapboxkey',     ['pk.eyJ1IjoibW', 'F4c3Ryb20iLCJhIjoiWlZXMWg5Q',  'SJ9.wVPqsSnUL7wtNSLYGFNVSw'].join(''))

  $('a[href*=#]:not([href=#])').click(function () {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target                = $(this.hash)
      var header                = $('header')

      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']')
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top - (header.height() * 1.3)
        }, 1000)
        return false
      }
    }
  })

  var lastScrollValue           = 0
  var $window                   = $(window)
  var scrollButton              = $('.scroll-top')

  var targetScroll              = $(scrollButton.find('a').get(0).hash)

  $window.scroll(function () {
    var scrollTop               = $window.scrollTop()

    if (lastScrollValue - scrollTop > 0 && scrollTop > targetScroll.offset().top) {
      scrollButton.fadeIn()
    } else {
      scrollButton.fadeOut()
    }

    lastScrollValue             = scrollTop
  })
})
