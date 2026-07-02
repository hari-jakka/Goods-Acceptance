sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/Dialog",
  ],
  function (
    BaseController,
    JSONModel,
    History,
    formatter,
    MessageToast,
    MessageBox,
    Button,
    Text,
    Dialog,
  ) {
    "use strict";

    return BaseController.extend("zxpapap0001a.controller.Object", {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the worklist controller is instantiated.
       * @public
       */
      onInit: function () {
        // Model used to manipulate control states. The chosen values make sure,
        // detail page shows busy indication immediately so there is no break in
        // between the busy indication for loading the view's meta data
        var oViewModel = new JSONModel({
          busy: true,
          delay: 0,
        });
        this.getRouter()
          .getRoute("object")
          .attachPatternMatched(this._onObjectMatched, this);
        this.setModel(oViewModel, "objectView");

        sap.ui.require(["sap/ushell/Container"], async (Container) => {
          const oNavigationService =
            await Container.getServiceAsync("Navigation");
          this.oNavigationService = oNavigationService;
        });
      },
      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /**
       * Event handler  for navigating back.
       * It there is a history entry we go one step back in the browser history
       * If not, it will replace the current entry of the browser history with the worklist route.
       * @public
       */
      onNavBack: function () {
        let oUpload = this.byId("UploadSet");
        if (oUpload) {
          oUpload.removeAllItems();
        }
        var sPreviousHash = History.getInstance().getPreviousHash();
        if (sPreviousHash !== undefined) {
          // eslint-disable-next-line fiori-custom/sap-no-history-manipulation
          history.go(-1);
        } else {
          this.getRouter().navTo("worklist", {}, true);
        }
      },

      onOpenPictures: function (oEvent) {
        this.pictureDialog ??= this.loadFragment({
          name: "zxpapap0001a.fragments.DelNotePicture",
        });

        this.pictureDialog.then((oDialog) => this.openPictureDialog(oDialog));
      },

      openPictureDialog: function (oDialog) {
        //  this.byId("UploadSet").setUploadUrl(this.getOwnerComponent().getModel().sServiceUrl + "/AttachmentSet");
        oDialog.open();
      },

      onOpenPicturesDamage: function (oEvent) {
        this.pictureDialogDamage ??= this.loadFragment({
          name: "zxpapap0001a.fragments.DelNotePictureDamage",
        });

        this.pictureDialogDamage.then((oDialog) =>
          this.openPictureDialogDamage(oDialog),
        );
      },

      openPictureDialogDamage: function (oDialog) {
        //  this.byId("UploadSet").setUploadUrl(this.getOwnerComponent().getModel().sServiceUrl + "/AttachmentSet");
        oDialog.open();
      },

      showDelNoteImage: function (evt) {
        const filename = evt.getSource().getProperty("text");
        const sections = filename.split(".");
        const extension = sections[sections.length - 1].toLowerCase();

        var sSrc = evt.getSource().getTarget();
        var baseurl = this.getOwnerComponent().getModel().sServiceUrl;
        var es =
          "/DelNoteAttachSet(DocumentId='" + sSrc + "',ObjectId='')/$value";
        var fullurl = baseurl + es;

        if (extension === "pdf") {
          var oModel = this.getOwnerComponent().getModel();
          var sToken = oModel.getSecurityToken();
          fetch(fullurl, {
            headers: { "X-CSRF-Token": sToken },
            credentials: "include",
          })
            .then(function (response) { return response.blob(); })
            .then(function (blob) {
              var blobUrl = URL.createObjectURL(blob);
              var oIframe = new sap.ui.core.HTML({
                content: '<iframe src="' + blobUrl + '" style="width:100%;height:75vh;border:none;display:block;"></iframe>',
              });
              var oDialog1 = new Dialog({
                contentWidth: "90%",
                content: oIframe,
                beginButton: new sap.m.Button({
                  text: "Close",
                  press: function () { oDialog1.close(); },
                }),
                endButton: new sap.m.Button({
                  icon: "sap-icon://download",
                  text: "Download",
                  press: function () {
                    var oLink = document.createElement("a");
                    oLink.href = blobUrl;
                    oLink.download = filename;
                    oLink.click();
                  },
                }),
                afterClose: function () {
                  URL.revokeObjectURL(blobUrl);
                  oDialog1.destroy();
                },
              });
              oDialog1.open();
            });
        } else {
          var oDialog1 = new Dialog({
            content: new sap.m.Image({ src: fullurl }),
            beginButton: new sap.m.Button({
              text: "Close",
              press: function () { oDialog1.close(); },
            }),
            afterClose: function () { oDialog1.destroy(); },
          });
          oDialog1.open();
        }
      },

      handleUploadPress: function (oEvent) {
        const that = this;
        const oModel = this.getModel();
        let oFileUploader = this.byId("fileUploader");
        let sDelivery = this.getView().byId("_val20").getText();
        let sFileName =
          "DeliveryNote_" +
          oFileUploader.getProperty("value") +
          ";" +
          sDelivery +
          ";" +
          this.getView().getBindingContext().getProperty("DeliveryType");

        oModel.refreshSecurityToken();

        oFileUploader.destroyHeaderParameters();
        oFileUploader.setUploadUrl(
          this.getOwnerComponent().getModel().sServiceUrl + "/DelNoteAttachSet",
        );
        oFileUploader
          .checkFileReadable()
          .then(
            async function () {
              oFileUploader.addHeaderParameter(
                new sap.ui.unified.FileUploaderParameter({
                  name: "slug",
                  value: sFileName,
                  // value: "DeliveryNote;" + sDelivery
                }),
              );
              oFileUploader.addHeaderParameter(
                new sap.ui.unified.FileUploaderParameter({
                  name: "X-CSRF-Token",
                  value: oModel.getSecurityToken(),
                }),
              );
              oFileUploader.setSendXHR(true);
              await oFileUploader.upload();
            },
            function (error) {
              MessageToast.show(
                "The file cannot be read. It may have changed.",
              );
            },
          )
          .then(
            function () {
              oFileUploader.clear();
              MessageToast.show(that.getModel("i18n").getResourceBundle().getText("msgImageStored"));

              oModel.refresh();

              setTimeout(() => {
                oModel.refresh();
              }, 1500);

              that.onClosePictureDialog();
            }.bind(this),
          );
      },

      handleUploadPressDamage: function () {
        const that = this;
        const oModel = this.getModel();
        let oFileUploader = this.byId("fileUploaderDamage");

        const view = this.getView();

        oModel.refreshSecurityToken();
        oFileUploader.destroyHeaderParameters();
        oFileUploader.setUploadUrl(
          this.getOwnerComponent().getModel().sServiceUrl + "/DelNoteAttachSet",
        );
        oFileUploader
          .checkFileReadable()
          .then(
            function () {
              oFileUploader.addHeaderParameter(
                new sap.ui.unified.FileUploaderParameter({
                  name: "slug",
                  value:
                    "DamagePicture;" + view.byId("_linknotifdamage").getText(),
                }),
              );
              oFileUploader.addHeaderParameter(
                new sap.ui.unified.FileUploaderParameter({
                  name: "X-CSRF-Token",
                  value: oModel.getSecurityToken(),
                }),
              );
              oFileUploader.setSendXHR(true);
              oFileUploader.upload();
            },
            function (error) {
              MessageToast.show(
                "The file cannot be read. It may have changed.",
              );
            },
          )
          .then(
            function () {
              oFileUploader.clear();
              MessageToast.show(that.getModel("i18n").getResourceBundle().getText("msgImageStored"));
            }.bind(this),
          );

        // var oFileUploader = this.byId("fileUploaderDamage");
        // if (!this.csrfToken) {
        //     this.csrfToken = this.getView().getModel().oHeaders['x-csrf-token'];
        //     oFileUploader.setSendXHR(true);
        //     oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
        //         name: "X-CSRF-Token", value: this.csrfToken}));
        //     oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
        //         name: "slug", value: "DamagePicture;" + this.getView().byId("_linknotifdama").getText()
        //     }));
        // }
        // oFileUploader.setUploadUrl(`${this.getOwnerComponent().getModel().sServiceUrl}/AttachmentSet`)
        // oFileUploader.checkFileReadable().then(function() {
        // 	oFileUploader.upload();
        // }, function(error) {
        // 	MessageToast.show("The file cannot be read. It may have changed.");
        // }).then(function() {
        // 	oFileUploader.clear();
        // });
      },

      onBeforeUploadStarts: function (oEvent) {
        var oUploadSet = oEvent.getSource();
        var oItemToUpload = oEvent.getParameter("item");
        var oCustomerHeaderToken = new sap.ui.core.Item({
          key: "x-csrf-token",
          text: this.getModel().getSecurityToken(),
        });

        // Header Slug
        var sDeliveryDocument = this.getView()
          .getBindingContext()
          .getProperty("DeliveryDocument");
        var oCustomerHeaderSlug = new sap.ui.core.Item({
          key: "slug",
          text: oItemToUpload.getFileName() + ";" + sDeliveryDocument,
        });

        oUploadSet.removeAllHeaderFields();
        oUploadSet.addHeaderField(oCustomerHeaderToken);
        oUploadSet.addHeaderField(oCustomerHeaderSlug);
      },

      onClosePictureDialog: function (oEvent) {
        this.byId("DelNotePictureDialog").close();
      },

      onClosePictureDialogDamage: function (oEvent) {
        this.byId("DelNotePictureDamageDialog").close();
      },

      /* =========================================================== */
      /* internal methods                                            */
      /* =========================================================== */

      /**
       * Binds the view to the object path.
       * @function
       * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
       * @private
       */
      _onObjectMatched: function (oEvent) {
        var sObjectId = oEvent.getParameter("arguments").objectId;
        var sObjectPath = "/ZOPEN_DELIVERY_OVERVIEW_GR" + sObjectId;
        this._bindView(sObjectPath);
        this.getView().getElementBinding().refresh(true);
      },

      /**
       * Binds the view to the object path.
       * @function
       * @param {string} sObjectPath path to the object to be bound
       * @private
       */
      _bindView: function (sObjectPath) {
        var oViewModel = this.getModel("objectView");

        this.getView().bindElement({
          path: sObjectPath,
          events: {
            change: this._onBindingChange.bind(this),
            dataRequested: function () {
              oViewModel.setProperty("/busy", true);
            },
            dataReceived: function () {
              oViewModel.setProperty("/busy", false);
            },
          },
        });
      },

      takePhotoPS: function () {
        var that = this;
        this.fixedDialog = new Dialog({
          title: "Click on Capture to take photo",
          beginButton: new sap.m.Button({
            text: "Capture Photo",
            press: function () {
              // TODO: get the object of our video player
              // take image object and set to main page.
              that.imageVal = document.getElementById("player");
              that.fixedDialog.close();
            },
          }),
          content: [
            new sap.ui.core.HTML({
              content: "<video id='player' autoplay></video>",
            }),
            //new sap.m.Input({
            //    placeholder: 'please enter image name here',
            //    required: true
            //})
          ],
          endButton: new sap.m.Button({
            text: "Cancel",
            press: function () {
              that.fixedDialog.close();
            },
          }),
        });

        this.getView().addDependent(this.fixedDialog);
        this.fixedDialog.open();

        this.fixedDialog.attachBeforeClose(this.setImage, this);

        var handleSuccess = function (stream) {
          //this.imageVal.srcObject = stream;
        };

        navigator.mediaDevices
          .getUserMedia({
            video: true,
          })
          .then(handleSuccess);
      },

      setImage: function () {
        // take image and write to backend?
      },

      onConfirm: function (sEvent) {
        const context = this.getView()
          .getBindingContext();

        if (context.getProperty("IsBlocked") != '') {
          const condition = context.getProperty("DelNoteAvailable") == 'N';

          const msg = this
            .getResourceBundle()
            .getText(condition ? "msgDelNoteMissing" : "msgOpenTopdeskIncident");

          MessageToast.show(msg);
          return;
        }

        const processIndicator = context
          .getProperty("ProcessIndicator");

        const that = this;

        const source = sEvent.getSource();

        if (this.validateInput()) {
          var oEntry = {};
          //var sPath = this._oDialog.getBindingContext().sPath;
          var d = this.getView().byId("_val20").getText();
          oEntry.DeliveryDocument = this.getView().byId("_val20").getText();
          oEntry.DeliveryPosition = this.getView().byId("_val26").getText();
          oEntry.ReceivedQuantity = this.getView().byId("_val23").getValue();
          oEntry.OpenQuantity = context.getProperty("OpenQuantity");
          const oUserInfo = sap.ushell.Container.getService("UserInfo");
          const sFirstName = oUserInfo.getUser().getFirstName();
          const sLastName = oUserInfo.getUser().getLastName();

          oEntry.bktxt = formatName(sFirstName, sLastName);
          // if (this.getView().byId("_val24").getState() === true) {
          //     oEntry.DeliveryNotePresent = "X";
          // } else {
          //     oEntry.DeliveryNotePresent = "";
          // }

          // that.getComponent().setBusy(true);
          source.setBusy(true);
          var oModel = this.getView().getModel();
          oModel.setUseBatch(false);
          oModel.create("/ZXPAP0001_Delivery", oEntry, {
            success: function () {
              source.setBusy(false);

              const isOrange = ["0", "1", "3"].indexOf(processIndicator) > -1;
              // console.log("ProcessIndicator, type: ", processIndicator, typeof processIndicator, isOrange);

              if (isOrange) {
                // oranje
                MessageBox.warning(
                  that
                    .getResourceBundle()
                    .getText("msgReceiptCompletedAcceptanceOpen"),
                  {
                    title: that
                      .getResourceBundle()
                      .getText("msgGoodsReceiptPosted"),
                    onClose: () => {
                      history.go(-1);
                      // that.getModel().refresh();
                    },
                  },
                );
              } else {
                //groen
                MessageBox.success(
                  that
                    .getResourceBundle()
                    .getText("msgReceiptCompleted"),
                  {
                    title: that
                      .getResourceBundle()
                      .getText("msgGoodsReceiptPosted"),
                    onClose: () => {
                      // that.getView().getModel().refresh();
                      history.go(-1);
                    },
                  },
                );
              }
            },
            error: function () {
              source.setBusy(false);
              MessageBox.error("Error storing record");
            },
          });
        }
      },

      showNotifConfirmDialog(oOptions) {
        // const oOptions = {
        //     switchCtrl: oEvent.getSource(),
        //     oldState: !oEvent.getParameter("state"),
        //     confirmCallback: this.createPackingSlipNotif,
        //     title: this.getResourceBundle.getText("notifCreateConfirmTitle");
        // }
        oOptions.confirmCallback.bind(this);

        if (!this.oNotifConfirmDialog) {
          this.oNotifConfirmDialog = new Dialog({
            type: "Message",
            title: "Confirm",
            content: new Text({
              text: this.getResourceBundle().getText("notifConfirmDialogText"),
            }),
            beginButton: new Button({
              type: "Emphasized",
              text: this.getResourceBundle().getText(
                "notifConfirmContinueText",
              ),
              press: function () {
                oOptions.confirmCallback(this);
                // this.createPackingSlipNotif();
                this.oNotifConfirmDialog.close();
              }.bind(this),
            }),
            endButton: new Button({
              text: this.getResourceBundle().getText("notifConfirmCancelText"),
              press: function () {
                oOptions.switchCtrl.setState(oOptions.oldState);
                this.oNotifConfirmDialog.close();
              }.bind(this),
            }),
          });
        }

        this.oNotifConfirmDialog.setTitle(oOptions.title);
        this.oNotifConfirmDialog.open();
      },

      onDamage: function (oEvent) {
        const oOptions = {
          switchCtrl: oEvent.getSource(),
          oldState: !oEvent.getParameter("state"),
          confirmCallback: this.createDamageNotif,
          title: this.getResourceBundle().getText("notifCreateConfirmTitle"),
        };

        if (
          this.getView().byId("_val25").getState() === true ||
          this.getView().byId("sw02").getState() === true
        ) {
          this.showNotifConfirmDialog(oOptions);
        }
      },

      onPressTopdesk: function (oEvent) {
        const url = oEvent.getSource().getBindingContext().getProperty("URL")

        if (url) {
          window.open(url, "_blank");
        }
      },

      createDamageNotif: function (oController) {
        const that = oController;
        const oDataModel = that.getOwnerComponent().getModel();
        oDataModel.setUseBatch(false);
        oDataModel.callFunction("/SetDamage", {
          method: "POST",
          urlParameters: {
            Delivery: that.getView().byId("_val20").getText(),
            Position: that.getView().byId("_val26").getText(),
            Depot: that.getView().byId("oa1").getText(),
          },
          success: function (oData, response) {
            MessageToast.show(response.data.SetDamage.Text);
            oDataModel.refresh();
          },
          error: function (oError) { },
        });
      },

      onIncidentType2: function (oEvent) {
        const that = this;
        this.incidentType2Dialog =
          this.createTopdeskDialog(
            "topdeskPackingSlipDialog",
            "02",
            () => {
              const model = that.getModel();
              model.refresh();
            },
            () => {
              // that.byId("_val24").setState(true);
            },
          );
        this.incidentType2Dialog.open();
      },

      onIncidentType3: function (oEvent) {
        const that = this;
        this.incidentType3Dialog =
          this.createTopdeskDialog(
            "topdeskIncidentType3",
            "03",
            () => {
              const model = that.getModel();
              model.refresh();
            },
            () => { },
          );
        this.incidentType3Dialog.open();
      },

      onIncidentType4: function (oEvent) {
        const that = this;
        this.incidentType4Dialog =
          this.createTopdeskDialog(
            "topdeskIncidentType4",
            "04",
            () => {
              const model = that.getModel();
              model.refresh();
            },
            () => { },
          );
        this.incidentType4Dialog.open();
      },

      validateInput: function () {
        const inputQuantity = this.getView().byId("_val23").getValue();
        const openQuantity = this.getView().byId("openqty_chk").getText();

        if (inputQuantity <= 0) {
          this.getView().byId("_val23").setValueState("Error");
          MessageToast.show(this.getResourceBundle().getText("NotifReceivedQty"));
          return false;
        }

        if (parseInt(inputQuantity) > parseInt(openQuantity)) {
          this.getView().byId("_val23").setValueState("Error");
          MessageToast.show("Open quantity more than received quantity");
          return false;
        } else {
          this.getView().byId("_val23").setValueState("None");
          return true;
        }
      },

      async onOpenDialogPS() {
        this.oDialogPS ??= await this.loadFragment({
          name: "zxpapap0001a.fragments.NotifPopupPackingSlip",
        });

        this.oDialogPS.open();
      },

      onCloseDialogPS() {
        // note: We don't need to chain to the pDialog promise, since this event-handler
        // is only called from within the loaded dialog itself.
        this.byId("notifDialogPS").close();
      },
      async onOpenDialogDamage() {
        this.oDialogDMG ??= await this.loadFragment({
          name: "zxpapap0001a.fragments.NotifPopupDamage",
        });

        this.oDialogDMG.open();
      },

      onCloseDialogDamage() {
        // note: We don't need to chain to the pDialog promise, since this event-handler
        // is only called from within the loaded dialog itself.
        this.byId("notifDialogDamage").close();
      },

      _onBindingChange: function () {
        this.showHideComposedItems();

        var oView = this.getView(),
          oViewModel = this.getModel("objectView"),
          oElementBinding = oView.getElementBinding();

        // No data for the binding
        if (!oElementBinding.getBoundContext()) {
          this.getRouter().getTargets().display("objectNotFound");
          return;
        }

        var oResourceBundle = this.getResourceBundle(),
          oObject = oView.getBindingContext().getObject(),
          sObjectId = oObject.MaterialNumber,
          sObjectName = oObject.ZOPEN_DELIVERY_OVERVIEW_GR;

        oViewModel.setProperty("/busy", false);
        oViewModel.setProperty(
          "/shareSendEmailSubject",
          oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]),
        );
        oViewModel.setProperty(
          "/shareSendEmailMessage",
          oResourceBundle.getText("shareSendEmailObjectMessage", [
            sObjectName,
            sObjectId,
            location.href,
          ]),
        );
      },

      onAfterRendering: function () {
        // this.showHideComposedItems();
      },

      showHideComposedItems: function () {
        console.log("show hide composed items");

        const oComponentsPanel = this.byId("componentsPanel");

        const context = this.getView().getBindingContext();

        if (context) {
          console.log("binding context found");
          // const visible = this.byId("idProductsTable").getItems().length > 0;
          const visible = context.getProperty("HasComposedItems") == "Y";

          oComponentsPanel.setVisible(visible);
        }
      },

      onNavToPicture: function () {
        //this.getRouter().navTo("object", {
        //    objectId: '12344' });
        this.getRouter().navTo("picture");
      },
    });
  },
);

function formatName(firstName, lastName) {
  if (firstName) {
    return `${lastName}, ${firstName}`;
  } else {
    return lastName;
  }
}
