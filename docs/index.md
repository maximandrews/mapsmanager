---
layout: default
title: Getting Started
secondTitle: Maps Manager
headerLogo: 1
sort: 1
description: Create maps easy
maps: mapbox,googlemap,bingmap
---

<div class="pph center-text" markdown="1">
# Create maps easy

### The only thing you need to know now is HTML.

### Everything else Maps Manager will handle for you.
</div>

<div class="pph">
  Now you can create Google Map as easy as:
{% highlight html %}
<div data-mapsmanager="googlemap" style="height:200px"></div>
<!-- include once // -->
<script src="/path/to/jquery.min.js"></script>
<script src="/path/to/mapsmanager.min.js"></script>
<!-- // include once -->
{% endhighlight %}
  <i>We recommend you to put all your CSS in separate file using HTML tag <code>&lt;link&gt;</code>. This example uses inline CSS to illustrate the ease of use of the Maps Manager.</i>
</div>

<div class="pph">
This will output nice Google Map like this:
<div data-mapsmanager="googlemap" style="height:200px"></div>
</div>

<div class="pph center-text">
For more examples and options see Maps Manager <a href="{{ site.url }}/documentation/">documentation</a>.
</div>

<div class="center-text github-btns" markdown="1">
  [Download .zip](https://github.com/{{ site.github_username }}/mapsmanager/releases/download/v1.0.0/mapsmanager-v1.0.0.zip){:target="_github_window_zip"}
  [Download .tar.gz](https://github.com/{{ site.github_username }}/mapsmanager/releases/download/v1.0.0/mapsmanager-v1.0.0.tar.gz){:target="_github_window_tar_gz"}
  [View source code on GitHub](https://github.com/{{ site.github_username }}/mapsmanager){:target="_github_window_source"}
</div>
