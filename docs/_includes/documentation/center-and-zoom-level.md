
<!--
*****************************************
*                                       *
*         Center and Zoom Level         *
*                                       *
*****************************************
-->

## Center and Zoom Level

<div class="pph">
  By default map is centered to <code>54.79257, -4.25293</code> with zoom level equal to <code>6</code>.
</div>

<div class="pph">
  To change map center you need to set <code>data-center</code> attribute to specific latitude and longitude separated by comma: <code>data-center="40.718119,-74.003906"</code>.
</div>

<div class="pph">
  To change map zoom level set <code>data-zoom</code> attribute to the value you need: <code>data-zoom="8"</code>.
</div>

<div class="pph">
  Combining all together resulting HTML code will look like:
{% highlight html %}
<div data-mapsmanager="mapbox" data-mapboxkey="1234567890" data-center="40.718119,-74.003906" data-zoom="8" style="height:200px"></div>
<!-- include once // -->
<script src="/path/to/jquery.min.js"></script>
<script src="/path/to/mapsmanager.min.js"></script>
<!-- // include once -->
{% endhighlight %}
  <i>We recommend you to put all your CSS in separate file using HTML tag</i> <code>&lt;link&gt;</code>.
</div>

<div class="pph">
  This is a preview of the code above:
  <div data-mapsmanager="mapbox" data-mapboxkey="1234567890" data-center="40.718119,-74.003906" data-zoom="8" style="height:200px"></div>
</div>
