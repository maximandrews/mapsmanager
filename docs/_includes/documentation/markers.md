
<!--
***************************
*                         *
*         Markers         *
*                         *
***************************
-->

## Markers

<div class="pph">
  Currently, there are two ways you can put one or more markers onto your map.<br><br>
  You should specify absolute path to the feed of your markers using attribute <code>data-feed</code> if you want your markers to be loaded every time map view bounds are changed. Use placeholder <code>$bounds</code> as a value of your selected parameter to notify your backend of current map view bounds. Placeholder <code>$bounds</code> will be substituted with the map view coordinates in the form of <code>south latitude, west longitude, north latitude, east longitude</code>. The coordinates of the map view will be appended to the path if placeholder <code>$bounds</code> will not be found. The map view coordinates example: <code>49.8138041489,-10.699362278,59.2510149736,2.1424407959</code>.<br><br>
  You should specify absolute path to the static file of your markers using attribute <code>data-feedonce</code> if you want your markers to be loaded all at once.<br><br>
</div>

<div class="pph">
  Let’s assume you decided to load all your markers at once. Your Map Manager HTML code will be:
{% highlight html %}
<div data-mapsmanager="bingmap" data-feedonce="/js/markers.json" data-mapboxkey="1234567890" style="height:500px"></div>
<!-- include once // -->
<script src="/path/to/jquery.min.js"></script>
<script src="/path/to/mapsmanager.min.js"></script>
<!-- // include once -->
{% endhighlight %}
  <i>We recommend you to put all your CSS in separate file using HTML tag</i> <code>&lt;link&gt;</code>.
</div>

<div class="pph">
  The preview of the code above:
  <div data-mapsmanager="bingmap" data-feedonce="/js/markers.json" data-mapboxkey="1234567890" data-zoom="5" style="height:500px"></div>
</div>

<div class="pph">
The markers feed or static file format should be as follows:
{% highlight json %}
[ [ latitude, longitude, '/marker/icon/path.image' ],
[ 51.115444, -0.715918, '/i/marker-icon.png' ],
...
[ 51.042102, -0.811518 ]]
{% endhighlight %}
The marker icon image can be omitted if default marker icon is set.
</div>

<div class="pph">
  To set default marker icon you should specify the URL of the default marker icon using <code>data-marker-icon</code> attribute.
</div>

<div class="pph">
  To set free space around every marker use <code>data-space</code> attribute. The value of the attribute will be used as the multiplier of the free space around the marker.
</div>
