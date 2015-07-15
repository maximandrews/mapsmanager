
<!--
*****************************
*                           *
*         Basic Map         *
*                           *
*****************************
-->

## Basic Map

<div class="pph">
  To activate Maps Manager you have to specify attribute <code>data-mapsmanager</code> to be <code>mapsmanager</code>. In case if you are willing to create any specific map from available set you should specify the name of the map. Currently there are available four types of maps: <code>bingmap</code>, <code>googlemap</code>, <code>mapbox</code> and <code>mapquest</code>.
</div>

<div class="pph">
  The code to create basic Google Map is shown below:
{% highlight html %}
<div data-mapsmanager="googlemap" style="height:200px"></div>
<!-- include once // -->
<script src="/path/to/jquery.min.js"></script>
<script src="/path/to/mapsmanager.min.js"></script>
<!-- // include once -->
{% endhighlight %}
  <i>We recommend you to put all your CSS in separate file using HTML tag</i> <code>&lt;link&gt;</code>.
</div>

<div class="pph">
  The code above will produce nice Google Map like this:
  <div data-mapsmanager="googlemap" style="height:200px"></div>
</div>
