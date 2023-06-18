var GpxMapGlPlugin = {
	map:null,
	uid:0,
	//palette: [ 0, "#57bb8a", 15, "#63b682", 30, "#73b87e", 45, "#84bb7b", 60, "#94bd77", 75, "#a4c073", 90, "#b0be6e", 105, "#c4c56d", 120, "#d4c86a", 135, "#e2c965", 150, "#f5ce62", 165, "#e9b861", 180, "#e6ad61", 195, "#ecac67", 210, "#e9a268", 225, "#e79a69", 240, "#e5926b", 255, "#e2886c", 270, "#e0816d", 285, "#dd776e" ],
	palette: [ 0, "#8CD47E", 60, "#8CD47E", 61, "#7ABD7E", 90, "#7ABD7E", 91, "#f8d66d", 120, "#f8d66d", 121, "#ffb54c", 150, "#ffb54c", 151, "#FF6961" ],

	handle:function(action) {
		var sourceLoadingCallback = null;
		var sourceId = null;

		document.title = 'Photos :: Iso Map';

		/* Reinitialize variables */
		GpxMapGlPlugin.map = undefined;
		GpxMapGlPlugin.knownSources = [];

		/* Remove theme, show map */
		$('#header').animate({opacity:0}, 'fast');
		$("body").append("<div id='map_canvas_gpxmapgl' style='position:absolute;height:100%;width:100%;z-index:2;top:0'></div>");
		$("#map_canvas_gpxmapgl").append("<div id='glprogress' style='z-index:99999;top:14px;right:50px;position:absolute;color:black'></div>");

		/* Create the map */
		GpxMapGlPlugin.map = new mapboxgl.Map({
			container: 'map_canvas_gpxmapgl', // container ID
			style: 'mapbox://styles/mapbox/light-v11', // style URL
			center: [8.28, 47.38], // starting position [lng, lat]
			zoom: 5, // starting zoom
			projection: {
				name: 'equalEarth'
			}
		});

		/* Add the callback mechanism to load data */
		GpxMapGlPlugin.map.on('sourcedata', function(e) {
			if (GpxMapGlPlugin.map.getSource(sourceId) && GpxMapGlPlugin.map.isSourceLoaded(sourceId)) {
				if(sourceLoadingCallback) {
					var tmp = sourceLoadingCallback;
					sourceLoadingCallback = null;
					tmp();
				}
			}
		});

		/* When the map is done loading, load the tileset */
		GpxMapGlPlugin.map.on('load', () => {
			sourceId = config.gpxmapgl_tileset+'-rails';
			sourceLoadingCallback = function() { // when the tileset is loaded, display it!
				GpxMapGlPlugin.map.addLayer({
					'id': sourceId,
					'type': 'line',
					'source': sourceId,
					'source-layer': sourceId.replace(/.*?\./, ''),
					'layout': {
						'line-join': 'round',
						'line-cap': 'round'
					},
					//"filter": ["<=", ["get", "dur"], 0],
					"paint": {
						"line-color": [
							"interpolate",
							["linear"],
							["get", "dur"],
							...GpxMapGlPlugin.palette
						],
						"line-width": [
							"interpolate",
							["linear"],
							["get", "dur"],
							3, 5,
							180.5,	3,
							210, 2,
							806, 1
						]
					}
				}, 'road-label-simple');
				GpxMapGlPlugin.show('');
			};
			GpxMapGlPlugin.map.addSource(sourceId, {
				type: 'vector',
				url: 'mapbox://'+sourceId // load the tileset
			});
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
			$('#glprogress').text('Still '+GpxMapGlPlugin.pendingCalls.length+' gpx to load');
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
		if(GpxMapGlPlugin.pendingCalls.length > 0)
			$('#glprogress').text('Still '+GpxMapGlPlugin.pendingCalls.length+' gpx to load');
		else
			$('#glprogress').text('');
	},

	ajaxRelaunch:function() {
		if(GpxMapGlPlugin.pendingCalls.length && (GpxMapGlPlugin.priorityCalls + GpxMapGlPlugin.lowpriorityCalls <= GpxMapGlPlugin.maxCallsAjax)) {
			var call = GpxMapGlPlugin.pendingCalls.shift();
			GpxMapGlPlugin.ajaxQueue(call.dir, call.cb, true);
		}
	},


	/* Recursively show gpx in directories.
	 * The thumbnail of a directory is stored in the parent dir json, so propagate that */
	show:function(dir) {
		// We want to prioritize loading of GPX, so queue dir parsing
		var json = GpxMapGlPlugin.ajaxQueue(dir, function() { GpxMapGlPlugin.show(dir); });

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
			GpxMapGlPlugin.show(dir+'/'+d.url);
		}
	},

	showTrack: function(gpx, id) {
		if(!gpx)
			return;

		var coordinates = [];
		for(var i in gpx) {
			coordinates.push([parseFloat(gpx[i][1]), parseFloat(gpx[i][0])]); // for some reason lat/lon are inverted in the json...
		}
		var geojson = {
			"type": "geojson",
			"data": {
				"type": "FeatureCollection",
				"features": [{
					"type": "Feature",
					"geometry": {
						"type": "LineString",
						"coordinates": coordinates
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
				"line-color": "blue",
				"line-width": 2
			}
		}, 'road-label-simple');
	},
};
