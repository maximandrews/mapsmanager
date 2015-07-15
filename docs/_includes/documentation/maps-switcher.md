
<!--
*********************************
*                               *
*         Maps Switcher         *
*                               *
*********************************
-->

## Maps Switcher

<div class="pph">
  By default to create Maps Manager map you should use <code>mapsmanager</code> as the value of the <code>data-mapsmanager</code> attribute. In this case maps switcher with all available map types sorted by the name will be created.
</div>

<div class="pph">
  If you need only selected map types you should set the value of the <code>data-maps</code> attribute to the map types you required separated by comma. The order of the map type buttons will be the same as the order of map types you specified.
</div>

<div class="pph">
  Lets assume you need <code>googlemap</code>, <code>mapbox</code> and <code>bingmap</code> in the order stated. The resulting code will look like:
{% highlight html %}
<div data-mapsmanager="mapsmanager" data-maps="googlemap, mapbox, bingmap" data-mapboxkey="1234567890" data-bingmapkey="1234567890" style="height:200px"></div>
<!-- include once // -->
<script src="/path/to/jquery.min.js"></script>
<script src="/path/to/mapsmanager.min.js"></script>
<!-- // include once -->
{% endhighlight %}
  <i>We recommend you to put all your CSS in separate file using HTML tag</i> <code>&lt;link&gt;</code>.
</div>

<div class="pph">
  The preview of the code above:
  <div data-mapsmanager="mapsmanager" data-maps="googlemap, mapbox, bingmap" data-mapboxkey="1234567890" data-bingmapkey="1234567890" style="height:200px"></div>
</div>
