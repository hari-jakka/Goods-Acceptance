sap.ui.define(["./BaseController"], function (BaseController) {
  "use strict";

  return BaseController.extend("zxpapap0001a.controller.NotFound", {
    /**
     * Navigates to the worklist when the link is pressed
     * @public
     */
    onLinkPressed: function () {
      this.getRouter().navTo("worklist");
    },
  });
});
