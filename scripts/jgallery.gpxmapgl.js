var GpxMapGlPlugin = {
	map:null,
	uid:0,

	handle:function(action) {
		document.title = 'Photos :: Iso Map';

		/* Reinitialize variables */
		GpxMapGlPlugin.map = undefined;
		GpxMapGlPlugin.knownSources = [];

		/* Remove theme, show map */
		$('#header').animate({opacity:0}, 'fast');
		$("body").append("<div id='map_canvas_gpxmapgl' style='position:absolute;height:100%;width:100%;z-index:2;top:0'></div>");

		GpxMapGlPlugin.map = new mapboxgl.Map({
			container: 'map_canvas_gpxmapgl', // container ID
			style: 'mapbox://styles/mapbox/light-v11', // style URL
			center: [8.28, 47.38], // starting position [lng, lat]
			zoom: 5, // starting zoom
			projection: {
				name: 'equalEarth'
			}
		});
		$('#content').animate({opacity:1}, "fast");

		/* ... and close button top right */
		var close = $("#map_canvas_gpxmapgl").append("<div style='z-index:99999;top:5px;right:5px;position:absolute;'><img id='map_pics_gpxmap_close' src='themes/_common/fsclose.png' style='width:28px;margin:3px;cursor:pointer;' /></div>");
		$('#map_pics_gpxmap_close').click(function() {
			GpxMapGlPlugin.leaveMap('');
		});
	},

	/* When we exit the map view we need to do some cleaning,
	 * so use a helper instead of jGallery.switchPage */
	leaveMap:function(action) {
		$('#header').css('opacity', 1);
		$('#map_canvas_gpxmapgl').remove();
		if(action.startsWith('/'))
			action = action.substr(1);
		window.location.hash = '#!'+action;
	},

	maxCallsAjax:4,
	priorityCalls:0,
	lowpriorityCalls:0,
	pendingCalls:[],
	inCache:{},
	ajaxQueue:function(dir, cb, async) {
		if(!GpxMapGlPlugin.inCache[dir] && (GpxMapGlPlugin.priorityCalls + GpxMapGlPlugin.lowpriorityCalls > GpxMapGlPlugin.maxCallsAjax)) {
			GpxMapGlPlugin.pendingCalls.push({dir:dir, cb:cb});
			return;
		}
		GpxMapGlPlugin.lowpriorityCalls++;
		var json = jGalleryModel.getJSON(dir, function() { GpxMapGlPlugin.ajaxDequeue(dir, cb); });
		if(json) {
			GpxMapGlPlugin.inCache[dir] = true;
			GpxMapGlPlugin.lowpriorityCalls--;
			if(async)
				cb();
			return json;
		}
		return;
	},

	ajaxDequeue:function(dir, cb) {
		GpxMapGlPlugin.inCache[dir] = true;
		cb();
		GpxMapGlPlugin.lowpriorityCalls--;
		GpxMapGlPlugin.ajaxRelaunch();
	},

	ajaxRelaunch:function() {
		if(GpxMapGlPlugin.pendingCalls.length && (GpxMapGlPlugin.priorityCalls + GpxMapGlPlugin.lowpriorityCalls <= GpxMapGlPlugin.maxCallsAjax)) {
			var call = GpxMapGlPlugin.pendingCalls.shift();
			GpxMapGlPlugin.ajaxQueue(call.dir, call.cb, true);
		}
	},


	/* Recursively show gpx in directories.
	 * The thumbnail of a directory is stored in the parent dir json, so propagate that */
	show:function(dir, thumbs) {
		// We want to prioritize loading of GPX, so queue dir parsing
		var json = GpxMapGlPlugin.ajaxQueue(dir, function() { GpxMapGlPlugin.show(dir, thumbs); });

		if(!json) {
			return; // wait
		} else if(json.type == "error") {
			//Ignore loading errors -- never happens in practice
			console.log("Unable to load json of dir "+dir);
		} else {
			json = json.json;
		}

		/* Find the cached json file for a given gpx */
		if(json.gpx) {
			var urls = [].concat(json.gpx);
			var regexp1 = new RegExp('^'+config.picsDir);
			var regexp2 = new RegExp('^'+config.cacheDir+'/json');
			for(var i in urls) {
				var url = urls[i].replace(regexp2, config.cacheDir+'/gpxmap');
				url = url.replace(regexp1, config.cacheDir+'/gpxmap');
				url = url.replace(/gpx$/, 'json');
				GpxMapGlPlugin.priorityCalls++;
				$.ajax({
					type: "GET",
					url: url,
					dataType:"json",
					success: function(json) {
						GpxMapGlPlugin.priorityCalls--;
						GpxMapGlPlugin.ajaxRelaunch();
						for(var s = 0; s < json.points.length; s++) {
							GpxMapGlPlugin.showTrack(json.points[s], GpxMapGlPlugin.uid++);
						}
					},
					error:function(e, f) {
						GpxMapGlPlugin.priorityCalls--;
						GpxMapGlPlugin.ajaxRelaunch();
						console.log("Cannot load "+url);
					},
				});
			}
		}

		/* Recurse */
		for (var i in json.dirs) {
			var d = json.dirs[i];
			GpxMapGlPlugin.show(dir+'/'+d.url, d.thumbs);
		}
	},

	showTrack: function(gpx, id) {
		if(!gpx)
			return;

		var geojson = {
			"type": "geojson",
			"data": {
				"type": "FeatureCollection",
				"features": [{
					"type": "Feature",
					"geometry": {
						"type": "LineString",
						"coordinates": gpx
					}
				}]
			}
		};
		GpxMapGlPlugin.map.addSource("route"+id, geojson);

		GpxMapGlPlugin.map.addLayer({
			"id": "route"+id,
			"type": "line",
			"source": "route"+id,
			"layout": {
				"line-join": "round",
				"line-cap": "round"
			},
			"paint": {
				"line-color": "lightgreen",
				"line-width": 8
			}
		});
	},
};
