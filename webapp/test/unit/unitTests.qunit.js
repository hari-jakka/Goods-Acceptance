/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"eu/aiden/ga/goodsacceptance/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});