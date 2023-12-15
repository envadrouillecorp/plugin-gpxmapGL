var GpxMapGlPluginHandle = {
	want:function(action) {
		// We don't want the action but we are still in display, let's remove our div!
		if(action != "isomap" && $('#map_canvas_gpxmapgl').length) {
			$('#header').css('opacity', 1);
			$('#map_canvas_gpxmapgl').remove();
		}
		return action.match(/^isomap/);
	},

	/* If we are in charge of this page, display it!*/
	handle:function(action) {
		jGallery.addCss('https://api.mapbox.com/mapbox-gl-js/v2.11.0/mapbox-gl.css', 'mapboxglcss', function() {
			$script('https://api.mapbox.com/mapbox-gl-js/v2.11.0/mapbox-gl.js', 'mapbox', function() {
				$script('admin/pages/gpxmapgl/scripts/jgallery.gpxmapgl.js?'+Math.random(), 'gpxmapgl', function() {
					mapboxgl.accessToken = config.gpxmapgl_token;
					GpxMapGlPlugin.handle(action);
				});
			});
		});
	},

	showGPXHook:function() {
		/*if(jGallery.currentPage == '') {
	 $('#contentb').append('<div style="width: 100%; text-align: center;clear:both;opacity:0" id="gpxmaplink"><a href="#!map" class="translate" style="border-bottom:1px dotted #EEE;text-decoration: none;">'+jGalleryModel.translate('SHOW MAP')+'</a></div>');
	 $('#gpxmaplink').animate({opacity:1}, 'fast');
	      }*/
	},

	init:function() {
		jGallery.plugins.push(GpxMapGlPluginHandle);
		config.content_order.push('gpxmapgl');
		config.contentPlugins['gpxmapgl'] = GpxMapGlPluginHandle.showGPXHook;
		gpxMapGlChangeLang();
		$('<div class="customtranslate"/>').bind('languagechangeevt', gpxMapGlChangeLang).appendTo($('body'));
	},
};

config.pluginsInstances.push(GpxMapGlPluginHandle);

function gpxMapGlChangeLang() {
	if(jGallery.lang == 'fr') {
		var tr = {
			'Public Transport Map':'Carte Isochrone',
			'SHOW ISOCHRONE MAP':'AFFICHER LA CARTE DES ISOCHRONES',
		};
		config.tr = $.extend(config.tr, tr);
	}
}

