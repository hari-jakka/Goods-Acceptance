/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
  "use strict";

  sap.ui.require(["zxpapap0001a/test/unit/AllTests"], function () {
    QUnit.start();
  });
});
