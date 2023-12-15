class RulerControl {
	onAdd(map){
		this.map = map;
		this.enabled = false;
		this.container = document.createElement('div');
		this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group mapbox-control ruler-custom-control';
		this.container.innerHTML = '<div class="tools-box">' +
			'<button>' +
			'<span class="mapboxgl-ctrl-icon" style="font-size: 19px;font-weight:bold;padding: 2px 0 0 0;" aria-hidden="true">â†¦</span>' +
			'</button>' +
			'</div>';
		this.container.addEventListener('click', function() {
			if(!this.enabled) {
				this.enabled = true;
				GpxMapGlPlugin.startMeasure();
			} else {
				this.enabled = false;
				GpxMapGlPlugin.stopMeasure();
			}
		});
		return this.container;
	}
	onRemove(){
		this.container.parentNode.removeChild(this.container);
		this.map = undefined;
	}
}


var GpxMapGlPlugin = {
	map:null,
	globalGeoJson: {},
	uid:0,
	//palette: [ 0, "#57bb8a", 15, "#63b682", 30, "#73b87e", 45, "#84bb7b", 60, "#94bd77", 75, "#a4c073", 90, "#b0be6e", 105, "#c4c56d", 120, "#d4c86a", 135, "#e2c965", 150, "#f5ce62", 165, "#e9b861", 180, "#e6ad61", 195, "#ecac67", 210, "#e9a268", 225, "#e79a69", 240, "#e5926b", 255, "#e2886c", 270, "#e0816d", 285, "#dd776e" ],
	palette: [ 0, "#8CD47E", 60, "#8CD47E", 61, "#7ABD7E", 90, "#7ABD7E", 91, "#f8d66d", 120, "#f8d66d", 121, "#ffb54c", 150, "#ffb54c", 151, "#FF6961" ],
	sourceLoadingCallback:null,
	sourceId:null,

	handle:function(action) {

		document.title = 'Photos :: Iso Map';

		/* Reinitialize variables */
		GpxMapGlPlugin.map = undefined;
		GpxMapGlPlugin.sourceLoadingCallback = null;
		GpxMapGlPlugin.sourceId = null;
		GpxMapGlPlugin.globalGeoJson = {
			"type": "geojson",
			// "tolerance": 3, // no need to simplify
			"data": {
				"type": "FeatureCollection",
				"features": []
			}
		};

		/* Remove theme, show map */
		$('#header').animate({opacity:0}, 'fast');
		$("body").append("<div id='map_canvas_gpxmapgl' style='position:absolute;height:100%;width:100%;z-index:2;top:0'></div>");
		$("#map_canvas_gpxmapgl").append("<div id='glprogress' style='z-index:99999;top:14px;right:50px;position:absolute;color:black'></div>");

		/* Create the map */
		GpxMapGlPlugin.map = new mapboxgl.Map({
			container: 'map_canvas_gpxmapgl', // container ID
			//style: 'mapbox://styles/mapbox/light-v11', // style URL
			//style: 'mapbox://styles/joeppmmmmm/clj6udapr004u01p91x6h1h54', // style URL
			style: 'mapbox://styles/joeppmmmmm/clj765p39006401p99nhhe55j', // style URL
			center: [8.28, 47.38], // starting position [lng, lat]
			zoom: 5, // starting zoom
			/*projection: {
				name: 'equalEarth'
				}*/
		});

		/* Add the callback mechanism to load data */
		GpxMapGlPlugin.map.on('sourcedata', function(e) {
			if (GpxMapGlPlugin.map.getSource(GpxMapGlPlugin.sourceId) && GpxMapGlPlugin.map.isSourceLoaded(GpxMapGlPlugin.sourceId)) {
				if(GpxMapGlPlugin.sourceLoadingCallback) {
					var tmp = GpxMapGlPlugin.sourceLoadingCallback;
					GpxMapGlPlugin.sourceLoadingCallback = null;
					tmp();
				}
			}
		});

		/* When the map is done loading, load the tileset */
		GpxMapGlPlugin.map.on('load', () => {
			/*GpxMapGlPlugin.map.addSource('mapbox-dem', {
				'type': 'raster-dem',
				'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
				'tileSize': 512,
				'maxzoom': 14
				});
				// add the DEM source as a terrain layer with exaggerated height
				GpxMapGlPlugin.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });*/

				GpxMapGlPlugin.map.addControl(new RulerControl(),'top-left')
				GpxMapGlPlugin.map.addControl(new mapboxgl.ScaleControl());

				GpxMapGlPlugin.show('');

				/*GpxMapGlPlugin.sourceId = config.gpxmapgl_tileset+'-rails';
				GpxMapGlPlugin.sourceLoadingCallback = function() { // when the tileset is loaded, display it!
				GpxMapGlPlugin.map.addLayer({
				'id': GpxMapGlPlugin.sourceId,
				'type': 'line',
				'source': GpxMapGlPlugin.sourceId,
				'source-layer': GpxMapGlPlugin.sourceId.replace(/.*?\./, ''),
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
				}, 'road-label-sm');
				GpxMapGlPlugin.addStations();
				};
				GpxMapGlPlugin.map.addSource(GpxMapGlPlugin.sourceId, {
				type: 'vector',
				url: 'mapbox://'+GpxMapGlPlugin.sourceId // load the tileset
				});*/
		});

		$('#content').animate({opacity:1}, "fast");

		/* ... and close button top right */
		var close = $("#map_canvas_gpxmapgl").append("<div style='z-index:99999;top:5px;right:5px;position:absolute;'><img id='map_pics_gpxmap_close' src='themes/_common/fsclose.png' style='width:28px;margin:3px;cursor:pointer;' /></div>");
		$('#map_pics_gpxmap_close').click(function() {
			GpxMapGlPlugin.leaveMap('');
		});

	},

	addStations:function() {
		GpxMapGlPlugin.sourceId = config.gpxmapgl_tileset+'-stations';
		GpxMapGlPlugin.sourceLoadingCallback = function() {
			GpxMapGlPlugin.map.addLayer({
				"id": GpxMapGlPlugin.sourceId,
				"type": "circle",
				"source": GpxMapGlPlugin.sourceId,
				"source-layer": GpxMapGlPlugin.sourceId.replace(/.*?\./, ''),
				"layout": {},
				"paint": {
					"circle-radius": [
						"interpolate",
						["linear"],
						["zoom"],
						0, 3,
						9.63, 3,
						11.3, 3,
						22, 3
					],
					"circle-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						0, 0,
						7.29, 0,
						8.57, 0.3,
						10, 0.99,
						22, 0.99
					],
					"circle-color": [
						"interpolate",
						["linear"],
						["get", "dur"],
						...GpxMapGlPlugin.palette
					],
					"circle-stroke-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						0, 0,
						9.5, 0,
						10, 0.5,
						22, 1
					],
					"circle-stroke-width": 1
				}
			}, 'road-label-sm');
			GpxMapGlPlugin.show('');
		};
		GpxMapGlPlugin.map.addSource(GpxMapGlPlugin.sourceId, {
			type: 'vector',
			url: 'mapbox://'+GpxMapGlPlugin.sourceId
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
							GpxMapGlPlugin.addTrack(json.points[s], GpxMapGlPlugin.uid++);
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

	addTrack: function(gpx, id) {
		if(!gpx)
			return;

		var coordinates = [];
		for(var i in gpx) {
			coordinates.push([parseFloat(gpx[i][1]), parseFloat(gpx[i][0])]); // for some reason lat/lon are inverted in the json...
		}
		var geojson = {
			"type": "Feature",
			"geometry": {
				"type": "LineString",
				"coordinates": coordinates
			}
		};
		GpxMapGlPlugin.globalGeoJson.data.features.push(geojson);
		GpxMapGlPlugin.displayTracks();
	},

	displayTracks: function() {
		if(!GpxMapGlPlugin.map.getSource("route")) {
			GpxMapGlPlugin.map.addSource("route", GpxMapGlPlugin.globalGeoJson);

			GpxMapGlPlugin.map.addLayer({
				"id": "route",
				"type": "line",
				"source": "route",
				"layout": {
					"line-join": "round",
					"line-cap": "round"
				},
				"paint": {
					"line-color": "#FF10F0",
					"line-width": 2
				}
			}, 'road-label-sm');
		} else {
			GpxMapGlPlugin.map.getSource("route").setData(GpxMapGlPlugin.globalGeoJson.data);
		}
	},

	startMeasure: function() {
		$script("https://unpkg.com/@turf/turf@6/turf.min.js", "turf", function(){
			$("body").append('<div id="distance" style="position: absolute; top: 10px; left: 10px; z-index: 1; background-color: rgba(0, 0, 0, 0.5); color: #fff; font-size: 11px; line-height: 18px; display: block; margin: 0; padding: 5px 10px; border-radius: 3px;"></div>');

			const distanceContainer = document.getElementById('distance');

			const geojson = {
				'type': 'FeatureCollection',
				'features': []
			};

			// Used to draw a line between points
			const linestring = {
				'type': 'Feature',
				'geometry': {
					'type': 'LineString',
					'coordinates': []
				}
			};

			GpxMapGlPlugin.map.addSource('geojson', {
				'type': 'geojson',
				'data': geojson
			});

			// Add styles to the map
			GpxMapGlPlugin.map.addLayer({
				id: 'measure-points',
				type: 'circle',
				source: 'geojson',
				paint: {
					'circle-radius': 5,
					'circle-color': '#000'
				},
				filter: ['in', '$type', 'Point']
			});
			GpxMapGlPlugin.map.addLayer({
				id: 'measure-lines',
				type: 'line',
				source: 'geojson',
				layout: {
					'line-cap': 'round',
					'line-join': 'round'
				},
				paint: {
					'line-color': '#000',
					'line-width': 2.5
				},
				filter: ['in', '$type', 'LineString']
			});

			GpxMapGlPlugin.map.on('click', (e) => {
				const features = GpxMapGlPlugin.map.queryRenderedFeatures(e.point, {
					layers: ['measure-points']
				});

				// Remove the linestring from the group
				// so we can redraw it based on the points collection.
				if (geojson.features.length > 1) geojson.features.pop();

				// Clear the distance container to populate it with a new value.
				distanceContainer.innerHTML = '';

				// If a feature was clicked, remove it from the map.
				if (features.length) {
					const id = features[0].properties.id;
					geojson.features = geojson.features.filter(
						(point) => point.properties.id !== id
					);
				} else {
					const point = {
						'type': 'Feature',
						'geometry': {
							'type': 'Point',
							'coordinates': [e.lngLat.lng, e.lngLat.lat]
						},
						'properties': {
							'id': String(new Date().getTime())
						}
					};

					geojson.features.push(point);
				}

				if (geojson.features.length > 1) {
					linestring.geometry.coordinates = geojson.features.map(
						(point) => point.geometry.coordinates
					);

					geojson.features.push(linestring);

					// Populate the distanceContainer with total distance
					const value = document.createElement('pre');
					const distance = turf.length(linestring);
					value.textContent = `Total distance: ${distance.toLocaleString()}km`;
					distanceContainer.appendChild(value);
				}

				GpxMapGlPlugin.map.getSource('geojson').setData(geojson);
			});

		});
	},

	stopMeasure: function() {
		$("#distance").remove();
		GpxMapGlPlugin.map.removeLayer("measure-points");
		GpxMapGlPlugin.map.removeLayer("measure-lines");
		GpxMapGlPlugin.map.removeSource("geojson");
	},
};
