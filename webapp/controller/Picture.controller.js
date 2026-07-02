sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
    "sap/m/MessageToast",
  ],
  function (BaseController, JSONModel, History, formatter, MessageToast) {
    "use strict";

    return BaseController.extend("zxpapap0001a.controller.Picture", {
      onInit: function () {
        var oViewModel = new JSONModel({
          page: {
            busy: false,
            editable: true,
          },
          data: {
            items: [{}],
            attachments: [],
          },
        });
        this.setModel(oViewModel, "pictureView");

        this.byId("UploadSet").setUploadUrl(
          this.getOwnerComponent().getModel().sServiceUrl + "/AttachmentSet",
        );
      },
      startUpload: function () {
        var oUploadSet = this.byId("UploadSet");
        var cFiles = oUploadSet.getIncompleteItems().length;

        if (cFiles > 0) {
          oUploadSet.upload();
        }
      },

      onBeforeUploadStarts: function (oEvent) {
        var oUploadSet = oEvent.getSource();
        var oItemToUpload = oEvent.getParameter("item");
        var oCustomerHeaderToken = new sap.ui.core.Item({
          key: "x-csrf-token",
          text: this.getModel().getSecurityToken(),
        });

        // Header Slug
        var oCustomerHeaderSlug = new sap.ui.core.Item({
          key: "slug",
          text:
            oItemToUpload.getFileName() +
            ";" +
            this.getView().byId("inpequi").getValue(),
        });

        oUploadSet.removeAllHeaderFields();
        oUploadSet.addHeaderField(oCustomerHeaderToken);
        oUploadSet.addHeaderField(oCustomerHeaderSlug);
      },

      onUploadCompleted: function (oEvent) {
        this.getModel("worklistView").refresh(true);
      },

      onOrderPress: function (oEvent) {
        var oViewModel = this.getModel("createView");
        //oViewModel.setProperty("/page/busy", true);

        this.startUpload();
        // var aItPoItemSet = oViewModel.getProperty("/data/items").map(function(oItem) {
        // 	return {
        // 		Matnr: oItem.Matnr,
        // 		Menge: this.convertToFloat(oItem.Menge, 2),
        // 		Brtwr: this.convertToFloat(oItem.Brtwr, 2),
        // 		TaxPercent: oItem.TaxPercent
        // 	};
        // }.bind(this));
        // var oDocument = {
        // 	Application: "SOSPO",
        // 	Aedat: oViewModel.getProperty("/data/Aedat"),
        // 	Ihrez: oViewModel.getProperty("/data/Ihrez"),
        // 	ItPoItemSet: aItPoItemSet
        // };
        // this.getView().getModel().create("/IsPoHeadSet", oDocument, {
        // 	success: function(oData, oResponse) {
        // 		oViewModel.setProperty("/page/editable", false);
        // 		this._documentNumber = oData.Ebeln;
        // 		this.startUpload();
        // 		oViewModel.setProperty("/page/busy", false);
        // 		sap.m.MessageToast.show(this.getResourceBundle().getText("savedMessage"));
        // 	}.bind(this),
        // 	error: function(oError) {
        // 		oViewModel.setProperty("/page/busy", false);
        // 	}.bind(this)
        // });
      },
    });
  },
);
