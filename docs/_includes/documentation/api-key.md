
<!--
***************************
*                         *
*         API Key         *
*                         *
***************************
-->

##API Key

<div class="pph">
  Every supported map has it own terminology for API key and its corresponding Maps Manager <code>data-</code> attribute:
  <ul>
    <li>Bing Map key or <code>credentials</code> corresponding attribute is <code>data-bingmapkey</code>;</li>
    <li>Google Map API key attribute is <code>data-googlemapkey</code>;</li>
    <li>MapBox <code>accessToken</code> corresponding attribute is <code>data-mapboxkey</code>;</li>
    <li>MapQuest API key attribute is <code>data-mapquestkey</code>.</li>
  </ul>
</div>

<div class="pph">
  API key should be always specified for all map types except Google Map.
</div>

<div class="pph">
  If your MapBox <code>accessToken</code> is <code>1234567890</code> then Maps Manager HTML code will look like:
{% highlight html %}
<div data-mapsmanager="mapbox" data-mapboxkey="1234567890" style="height:200px"></div>
<!-- include once // -->
<script src="/path/to/jquery.min.js"></script>
<script src="/path/to/mapsmanager.min.js"></script>
<!-- // include once -->
{% endhighlight %}
  <i>We recommend you to put all your CSS in separate file using HTML tag</i> <code>&lt;link&gt;</code>.
</div>

<div class="pph">
  The code above will produce smooth MapBox map like this:
  <div data-mapsmanager="mapbox" data-mapboxkey="1234567890" style="height:200px"></div>
</div>
