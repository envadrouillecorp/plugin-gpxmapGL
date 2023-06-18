<?php
/*
 * Copyright (c) 2023 Baptiste Lepers
 * Released under MIT License
 *
 * Mapbox Gpx map
 */

class Pages_GpxMapGl_Index {
	public static $description = "GPX Mapbox Isochrones";
	public static $isOptional = true;
	public static $showOnMenu = false;
	public static $isContentPlugin = true;
	public static $activatedByDefault = true;

	public static function setupAutoload() {
	}

	static public function getOptions() {
		return array(
			array('id' => 'gpxmapgl_token', 'type' => 'text', 'cat' => 'GPX Mapbox Isochrones', 'default' => "", 'export' => true),
			array('id' => 'gpxmapgl_tileset', 'type' => 'text', 'cat' => 'GPX Mapbox Isochrones', 'default' => "", 'export' => true),
		);
	}

	/* Alternatively we could include the code directly in index.html. Better? */
	static public function getUserFunctions() {
		return array(
			file_get_contents('./pages/gpxmapgl/scripts/jgallery.gpxmapgl.fun.js')
		);
	}
};
