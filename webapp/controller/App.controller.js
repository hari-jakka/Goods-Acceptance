sap.ui.define(["./BaseController"], function (BaseController) {
  "use strict";

  return BaseController.extend("zxpapap0001a.controller.App", {
    onInit: function () {
      // apply content density mode to root view
      this.getView().addStyleClass(
        this.getOwnerComponent().getContentDensityClass(),
      );
    },
  });
});
