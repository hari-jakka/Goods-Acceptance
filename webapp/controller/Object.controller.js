sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/m/CustomListItem",
    "eu/aiden/ga/goodsacceptance/controller/Question",
    "eu/aiden/ga/goodsacceptance/controller/ComposedItemDialog",
    "sap/m/HBox",
    "sap/m/Title",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "../model/formatter",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/ButtonType",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/Panel",
    "sap/m/Bar",
    "sap/ui/core/Icon",
], function (BaseController, JSONModel, History, CustomListItem, Question, ComposedItemDialog, HBox, Title, MessageToast, MessageBox, formatter, Dialog, Button, ButtonType, Text, VBox, Panel, Bar, Icon) {
    "use strict";

    return BaseController.extend("eu.aiden.ga.goodsacceptance.controller.Object", {

        formatter: formatter,
        oQuestion: Question,
        oComposedItemDialogController: ComposedItemDialog,

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
            let oViewModel = new JSONModel({
                busy: true,
                delay: 0,
                serialFlex: false,
                serialValid: false,
                serialState: 'None',
                newSerialnumber: '',
                vendorSerialValid: false,
                vendorSerialState: 'None',
                vendorSerialnumber: '',
                vinValid: false,
                vinState: 'None',
                vin: '',
                quantityValid: false,
                transferFlexAnswers: false,
                composedItems: false,
            });
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "objectView");

            this.viewId = this.getView().getId();
            this.oQuestion.viewId = this.getView().getId();
            this.oQuestion.controller = this;

            this.oComposedItemDialogController.onInit(this);

            // this.composedItemDialog = this.loadFragment({
            //     name: "eu.aiden.ga.goodsacceptance.fragments.ComposedItemDialog"
            // }).then(function(oDialog){
            //     this.composedItemDialog = oDialog
            // }.bind(this));
            // this.getOwnerComponent().getModel().setDeferredGroups(["answerGroup"]);

            let self = this;
            sap.ui.require(["sap/ushell/Container"], async (Container) => {
                const oNavigationService = await Container.getServiceAsync("Navigation");
                this.oNavigationService = oNavigationService;
            });

            this.getOwnerComponent().getService("ShellUIService").then(function (oShellService) {
                oShellService.setBackNavigation(this.onNavBack.bind(this))
            }.bind(this));

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

        onOpenPictures: function () {
            this.pictureDialog ??= this.loadFragment({
                name: "eu.aiden.ga.goodsacceptance.fragments.PictureDialog"
            });

            this.pictureDialog.then((oDialog) =>
                this.openPictureDialog(oDialog)
            );
        },

        openPictureDialog: function (oDialog) {
            this.byId("UploadSet").setUploadUrl(this.getOwnerComponent().getModel().sServiceUrl + "/AttachmentSet");
            oDialog.open();
        },

        onClosePictureDialog: function () {
            this.byId("pictureDialog").close();
        },

        uploadAllAttachments: function () {
            let oUpload = this.byId("UploadSet");
            oUpload.setUploadUrl(this.getOwnerComponent().getModel().sServiceUrl + "/AttachmentSet");

            if (oUpload) {
                let aItems = oUpload.getIncompleteItems();

                if (aItems.length > 0) {
                    oUpload.upload();
                }
            }
        },
        onPressTopdesk: function (oEvent) {
            const url = oEvent.getSource().getBindingContext().getProperty("URL")

            if (url) {
                window.open(url, "_blank");
            }
        },

        onIncidentType05: function (oEvent) {
            const that = this;

            this.incidentTypeDialog05 = this.createTopdeskDialog("incidentTypeDialog05", "05", () => {
                const model = that.getModel();
                model.refresh();
            }, () => {

            });
            this.incidentTypeDialog05.open();
        },

        onIncidentType06: function (oEvent) {
            const that = this;

            this.incidentTypeDialog06 = this.createTopdeskDialog("incidentTypeDialog06", "06", () => {
                const model = that.getModel();
                model.refresh();
            }, () => {
            });
            this.incidentTypeDialog06.open();
        },

        onIncidentType13: function (oEvent) {
            const that = this;

            this.incidentTypeDialog13 = this.createTopdeskDialog("incidentTypeDialog13", "13", () => {
                const model = that.getModel();
                model.refresh();
            }, () => {
            });
            this.incidentTypeDialog13.open();
        },


        onBeforeUploadStarts: function (oEvent) {
            const sNotification = this.sNotification;
            const oContext = this.getView().getBindingContext();
            const sDelivery = oContext.getProperty("DeliveryDocument");
            const sDeliveryPosnr = oContext.getProperty("DeliveryPosition");

            const oUploadSet = oEvent.getSource();
            const oItemToUpload = oEvent.getParameter("item");
            const oCustomerHeaderToken = new sap.ui.core.Item({
                key: "x-csrf-token",
                text: this.getModel().getSecurityToken()
            });


            // Header Slug
            const sFileName = "Deviation_" + sDelivery + "-" + sDeliveryPosnr + "_" + oItemToUpload.getFileName();

            const oCustomerHeaderSlug = new sap.ui.core.Item({
                key: "slug",
                text: sFileName + ";" + sNotification
            });

            oUploadSet.removeAllHeaderFields();
            oUploadSet.addHeaderField(oCustomerHeaderToken);
            oUploadSet.addHeaderField(oCustomerHeaderSlug);
        },

        onNavBack: async function (bRefreshWorklist) {
            if (!bRefreshWorklist) {
                bRefreshWorklist = true;
            }

            let oViewData = this.getModel("objectView").getData();

            if (oViewData.serialFlex && oViewData.transferFlexAnswers) {
                this.transferFlexAnswers();
            }

            this.getModel("objectView").setProperty("/serialFlex", false);
            this.getModel("objectView").setProperty("/transferFlexAnswers", false);

            let oUpload = this.byId("UploadSet");
            if (oUpload) {
                oUpload.removeAllItems();
            }

            //Initialize the answers object of the composed items
            this.oComposedItemDialogController.oAnswers = {};

            if (bRefreshWorklist) {
                // this.getOwnerComponent().refreshDeliveryTableBinding();
                // this.getOwnerComponent().getModel().refresh();
            }

            let sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                // eslint-disable-next-line fiori-custom/sap-no-history-manipulation
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        onExit: function () {
            const oViewData = this.getModel("objectView").getData();
            if (oViewData.serialFlex && oViewData.transferFlexAnswers) {
                this.transferFlexAnswers();
            }
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        _questionLineFactory: function (sId, oContext) {
            let bPhone = this.getOwnerComponent().getModel("device").getProperty("/system/phone");
            let oLine = this.oQuestion.createQuestionLine(sId, oContext, bPhone);

            return oLine;
        },

        onCreateNotification: async function () {
            let oContext = this.getView().getBindingContext();
            let oComponent = this.getOwnerComponent();
            const oTarget = {
                target: {
                    semanticObject: "GrGaNotifications",
                    action: "Display"
                },
                params: {
                    "Depot": oContext.getProperty("Depot"),
                    "Delivery": oContext.getProperty("Delivery") + "/" + oContext.getProperty("DeliveryPosnr"),
                    "Equipment": oContext.getProperty("EquipmentID")
                },
                appSpecificRoute: "Create"
            }

            // const sHref = await this.oNavigationService.getHref(oTarget, oComponent);

            // oTarget.target.shellHash = sHref;

            this.oNavigationService.navigate(oTarget, oComponent);

        },

        onScanSuccess: function (oEvent) {
            // get the id of the scan button
            const sScanBtnId = oEvent.getSource().getId().split("object--")[1];
            const sInputFieldId = sScanBtnId.split("ScannerButton")[0] + "Input";

            if (oEvent.getParameter("cancelled")) {
                MessageToast.show("Scan cancelled", { duration: 1000 });
            } else {
                if (oEvent.getParameter("text")) {
                    let sValue = oEvent.getParameter("text");

                    if (sScanBtnId === "serialScannerButton") {

                        if (sValue.search("/u/" !== -1)) {                  // "/u/" geeft aan dat er een uniek serienummer in de QR zit
                            let sSerial = sValue.split("/").pop(); //Laatste deel van de url string uit QR is het serienummer
                            this.byId(sInputFieldId).setValue(sSerial);
                            this.validateSerialnumber();
                        } else {
                            MessageToast.show("No Serialnumber found");
                        }
                    } else if (sScanBtnId === "vendorSerialScannerButton") {
                        this.byId(sInputFieldId).setValue(sValue);
                        this.validateVendorSerialnumber();

                    } else {
                        this.byId(sInputFieldId).setValue(sValue);
                    }
                }
            }
        },

        onQuantityChange: function (oEvent) {
            this.validateQuantity();
        },

        onVINChange: function (oEvent) {
            const oModel = this.getModel("objectView");
            const sVIN = oModel.getProperty("/vin");

            // Convert to uppercase
            if (sVIN) {
                oModel.setProperty("/vin", sVIN.toUpperCase());
            }

            this.validateVIN();
        },

        onSave: async function () {
        
            // this.uploadAllAttachments();

            // this.determineFlexScenario();


            // validate serialnumber if applicable
            const oViewData = this.getModel("objectView").getData();

            const context = this.getView().getBindingContext();
            const indirectScenario = context.getProperty("DeliveryType") == '7';
            const licenseFleet = context.getProperty("LicensedFleet") == 'Y';

            if (oViewData.serialFlex) {
                await this.validateSerialnumber();
                const isSerialValid = this.getModel("objectView").getProperty("/serialValid");
                console.log(isSerialValid);
                if (!isSerialValid) {
                    return;
                }

                if (indirectScenario && !this.validateVendorSerialnumber()) {
                    sap.m.MessageBox.warning(this.getResourceBundle().getText("msgInvalidSerialEQVendorSerial"), { title: "" });
                    return;
                }
            } else if (!this.validateQuantity()) {
                sap.m.MessageBox.warning(this.getResourceBundle().getText("msgQuantityInvalid"), { title: "" });
                return;
            }

            // Validate VIN if licensed fleet
            if (licenseFleet && !this.validateVIN()) {
                return;
            }

            let aQuestions = this.byId("questionTableMain").getItems(),
                oModel = this.getModel(),
                that = this;

            this.aNewEntries = [];
            this.bAllAnswered = true;
            this.bDeviation = false;
            this.aNotifDeviationText = [];

            const oUserInfo = sap.ushell.Container.getService("UserInfo");
            const sFirstName = oUserInfo.getUser().getFirstName();
            const sLastName = oUserInfo.getUser().getLastName();

            for (let index = 0; index < aQuestions.length; index++) {
                const oQuestion = aQuestions[index];

                let rowNumber = oQuestion.getId().split("questionTableMain-")[1];
                let oDeliveryData = this.getView().getBindingContext().getObject();

                let oContext = oQuestion.getBindingContext();
                let oQuestionData = oContext.getObject();
                let oDisplay = oContext.getProperty("to_AnswersDisplay");

                let oAnswerControl = this.byId("answerControlMain-" + rowNumber);
                let sAnswerValue = oAnswerControl.getAnswer();


                let oEntry = {};

                if (oAnswerControl.getDeviation) {
                    if (oAnswerControl.getDeviation()) {
                        this.bDeviation = true;
                        oEntry.Deviation = "D";

                        this.aNotifDeviationText.push(oAnswerControl.getDeviationText());
                    }
                }
                oEntry.Delivery = oDeliveryData.DeliveryDocument;
                oEntry.DeliveryPosnr = oDeliveryData.DeliveryPosition;
                oEntry.OpenQty = oDeliveryData.OpenQuantity;
                oEntry.SalesOrder = ''            // Only filled in case of Composed Items
                oEntry.SalesOrderPosition = ''    // Only filled in case of Composed Items
                oEntry.EquipmentID = oDeliveryData.EquipmentID === '1' ? '' : oDeliveryData.EquipmentID;
                oEntry.BulkUnique = oDeliveryData.BulkDelivery ? "0" : "1";
                oEntry.classnum = oQuestionData.classnum;
                oEntry.charact = oQuestionData.Charact;
                oEntry.AnswerValue = sAnswerValue;
                oEntry.bktxt = formatName(sFirstName, sLastName);
                oEntry.SerialNumber = this.getModel("objectView").getProperty("/newSerialnumber");
           
                // const serialFlex = this.getModel("objectView").getProperty("/serialFlex");

                // console.log("serial flex", serialFlex);
                // console.log(this.getModel("objectView").getProperty("/newSerialnumber"));

                // if (serialFlex) {
                //     oEntry.SerialNumber = this.getModel("objectView").getProperty("/newSerialnumber");
                // }

                // console.log(oEntry);

                this.aNewEntries.push(oEntry);

                if (oDisplay.Required && oDisplay.Visible && sAnswerValue === "") {
                    this.bAllAnswered = false;
                    oAnswerControl.setValueState(sap.ui.core.ValueState.Error);
                    oAnswerControl.setValueStateText(this.getResourceBundle().getText("msgFillValue"))   //("Vul een waarde in s.v.p.");
                } else {
                    oAnswerControl.setValueState();
                }
            }

            if (indirectScenario) {
                this.bAllAnswered = this.addVendorSerialAnswer(this.bAllAnswered);
            }

            if (licenseFleet) {
                this.bAllAnswered = this.addLicensePlateNumberAndVIN(this.bAllAnswered);
            }

            if (!oViewData.serialFlex) {
                this.bAllAnswered = this.addQuantityAnswer(this.bAllAnswered);
            }

            // this.bDeviation = this.quantityDeviations(this.bDeviation);

            this.bAllAnswered = this.composedItemsAnswered(this.bAllAnswered);
            console.log(this.bAllAnswered);
            this.bDeviation = this.composedItemsDeviations(this.bDeviation);


            if (!this.bAllAnswered) {
                sap.m.MessageBox.warning(this.getResourceBundle().getText("msgFillAllAnswers"), { title: "" });
                return;
            }

            if (this.bDeviation) {
                let sText = "";
                // Write the regular deviation texts 
                this.aNotifDeviationText.forEach(function (sDeviationLine) {
                    sText += sDeviationLine + " \n";
                });

                // add the composed items deviation texts 
                this.sNotifText = this.composedItemsDeviationsText(sText);

                // TODO: Set sNotifText on Remarks input field
                // TODO: Open topdeskDeviationDialog

                // this.onOpenNotifDialog();
                // this.open(); // TODO: Open dialog for Incident Type 08
                this.openTopdeskInfoDialog();
            } else {
                //Answers from the Composed item will be added within method "saveAnswers"
                this.saveAnswers();
            }
        },

        addVendorSerialAnswer: function (bAllAnswered) {
            const oUserInfo = sap.ushell.Container.getService("UserInfo");
            const sFirstName = oUserInfo.getUser().getFirstName();
            const sLastName = oUserInfo.getUser().getLastName();

            let bAnswered = true;
            const oDeliveryData = this.getView().getBindingContext().getObject();

            if (!oDeliveryData.DeliveryDocument || oDeliveryData.BulkDelivery) {
                return bAllAnswered;
            }

            if (oDeliveryData.BulkDelivery) {
                return bAllAnswered;
            }

            let sValueState = "None";
            const oVendorSerialInput = this.byId("vendorSerialInput");

            if (oVendorSerialInput.getValue() === "") {
                sValueState = "Error";
                bAnswered = false;
            } else {
                this.getModel("objectView").setProperty("/vendorSerialValid", true)
            }
            oVendorSerialInput.setValueState(sValueState);

            if (bAnswered) {
                let oEntry = {};
                oEntry.Delivery = oDeliveryData.DeliveryDocument;
                oEntry.DeliveryPosnr = oDeliveryData.DeliveryPosition;
                oEntry.OpenQty = oDeliveryData.OpenQuantity;
                oEntry.EquipmentID = oDeliveryData.EquipmentID === '1' ? '' : oDeliveryData.EquipmentID;
                oEntry.BulkUnique = oDeliveryData.BulkDelivery ? "0" : "1";
                oEntry.classnum = "";
                oEntry.charact = "SERGE"
                oEntry.AnswerValue = oVendorSerialInput.getValue();
                oEntry.bktxt = formatName(sFirstName, sLastName);

                if (this.getModel("objectView").getProperty("/serialFlex")) {
                    oEntry.SerialNumber = this.getModel("objectView").getProperty("/newSerialnumber");
                }

                this.aNewEntries.push(oEntry);
            } else {
                bAllAnswered = false;
            }

            return bAllAnswered;
        },

        addLicensePlateNumberAndVIN: function (bAllAnswered) {
            const oUserInfo = sap.ushell.Container.getService("UserInfo");
            const sFirstName = oUserInfo.getUser().getFirstName();
            const sLastName = oUserInfo.getUser().getLastName();

            const oDeliveryData = this.getView().getBindingContext().getObject();

            const serialNumber = this.getModel("objectView").getProperty("/serialFlex") ? this.getModel("objectView").getProperty("/newSerialnumber") : undefined;

            const oLicensePlateInput = this.byId("licensePlateInput");
            const oVINInput = this.byId("vinInput");

            this.aNewEntries.push({
                Delivery: oDeliveryData.DeliveryDocument,
                DeliveryPosnr: oDeliveryData.DeliveryPosition,
                OpenQty: oDeliveryData.OpenQuantity,
                EquipmentID: oDeliveryData.EquipmentID === '1' ? '' : oDeliveryData.EquipmentID,
                charact: "K0127",
                AnswerValue: oLicensePlateInput.getValue(), // licenseplate control
                bktxt: formatName(sFirstName, sLastName),
                SerialNumber: serialNumber
            });

            this.aNewEntries.push({
                Delivery: oDeliveryData.DeliveryDocument,
                DeliveryPosnr: oDeliveryData.DeliveryPosition,
                OpenQty: oDeliveryData.OpenQuantity,
                EquipmentID: oDeliveryData.EquipmentID === '1' ? '' : oDeliveryData.EquipmentID,
                charact: "K0128",
                AnswerValue: oVINInput.getValue(), // vin control
                bktxt: formatName(sFirstName, sLastName),
                SerialNumber: serialNumber
            });

            return bAllAnswered;
        },

        addQuantityAnswer: function (bAllAnswered) {
            const oUserInfo = sap.ushell.Container.getService("UserInfo");
            const sFirstName = oUserInfo.getUser().getFirstName();
            const sLastName = oUserInfo.getUser().getLastName();

            let bAnswered = true;
            const oDeliveryData = this.getView().getBindingContext().getObject();

            if (!oDeliveryData.BulkDelivery) {
                return bAllAnswered;
            }

            let sValueState = "None";
            const oQuantityInput = this.byId("inpQuantity");

            if (oQuantityInput.getValue() === "") {
                sValueState = "Error";
                bAnswered = false;
            }
            oQuantityInput.setValueState(sValueState);

            if (bAnswered) {
                let oEntry = {};
                oEntry.Delivery = oDeliveryData.DeliveryDocument;
                oEntry.DeliveryPosnr = oDeliveryData.DeliveryPosition;
                oEntry.OpenQty = oDeliveryData.OpenQuantity;
                oEntry.EquipmentID = oDeliveryData.EquipmentID === '1' ? '' : oDeliveryData.EquipmentID;
                oEntry.BulkUnique = oDeliveryData.BulkDelivery ? "0" : "1";
                oEntry.classnum = "";
                oEntry.charact = "WEMNG"
                oEntry.AnswerValue = oQuantityInput.getValue();
                oEntry.bktxt = formatName(sFirstName, sLastName);

                if (this.getModel("objectView").getProperty("/serialFlex")) {
                    oEntry.SerialNumber = this.getModel("objectView").getProperty("/newSerialnumber");
                }

                this.aNewEntries.push(oEntry);
            } else {
                bAllAnswered = false;
            }

            return bAllAnswered;
        },

        composedItemsRelevant: function () {
            let bRelevant = false;

            if (this.getModel("objectView").getProperty("/composedItems")) {
                bRelevant = true;
            }
            return bRelevant;
        },

        composedItemsAnswered: function (bAllAnswered) {
            if (!this.composedItemsRelevant()) {
                return bAllAnswered;
            }

            // check that all subitems have been handled
            const aListCompItem = this.byId("compItemsTable").getItems();

            for (let oListCompItem of aListCompItem) {
                let sSalesOrderPosition = oListCompItem.getBindingContext().getProperty("SalesOrderPosition");

                if (!this.oComposedItemDialogController.oAnswers[sSalesOrderPosition]) {
                    oListCompItem.setHighlight("Error");
                    bAllAnswered = false;
                } else {
                    oListCompItem.setHighlight("None");
                }
            }

            return bAllAnswered;
        },

        composedItemsDeviations: function (bDeviation) {
            if (!this.composedItemsRelevant()) {
                return bDeviation;
            }

            // check that all subitems have been handled
            const aListCompItem = this.byId("compItemsTable").getItems();

            for (let oListCompItem of aListCompItem) {
                let sSalesOrderPosition = oListCompItem.getBindingContext().getProperty("SalesOrderPosition");

                if (this.oComposedItemDialogController.oAnswers[sSalesOrderPosition] &&
                    this.oComposedItemDialogController.oAnswers[sSalesOrderPosition].deviations) {
                    bDeviation = true;
                }
            }

            // add compItem answers to the odata model
            return bDeviation;
        },

        composedItemsDeviationsText: function (sDeviationText) {
            if (!this.composedItemsRelevant()) {
                return sDeviationText;
            }

            let sCompDeviationText = "";

            // check that all subitems have been handled
            const aListCompItem = this.byId("compItemsTable").getItems();

            for (let oListCompItem of aListCompItem) {
                let sSalesOrderPosition = oListCompItem.getBindingContext().getProperty("SalesOrderPosition");

                if (this.oComposedItemDialogController.oAnswers[sSalesOrderPosition] &&
                    this.oComposedItemDialogController.oAnswers[sSalesOrderPosition].deviations) {
                    sCompDeviationText += this.oComposedItemDialogController.oAnswers[sSalesOrderPosition].deviationText;
                }
            }

            // add compItem deviations text to the rest
            sDeviationText += "\n \n" + sCompDeviationText;
            return sDeviationText;
        },

        addComposedItemsAnswers: function () {
            if (!this.composedItemsRelevant()) {
                return;
            }

            const aListCompItem = this.byId("compItemsTable").getItems();

            // itererate over all composed items
            for (let oListCompItem of aListCompItem) {
                let sSalesOrderPosition = oListCompItem.getBindingContext().getProperty("SalesOrderPosition");

                let aAnswers = this.oComposedItemDialogController.oAnswers[sSalesOrderPosition].answers;

                // add all answers of this composedItem 
                for (let oAnswer of aAnswers) {
                    this.aNewEntries.push(oAnswer);
                }
            }
        },

        onOpenNotifDialog: function () {
            if (!this.notifDialog) {
                this.notifDialog = this.loadFragment({
                    name: "eu.aiden.ga.goodsacceptance.fragments.NotificationDialog"
                });
            }

            this.notifDialog.then((oDialog) =>
                this.openNotifDialog(oDialog)
            );
        },

        openNotifDialog: function (oDialog) {
            // this.byId("deviationLongtext").setValue("");
            this.byId("deviationLongtext").setValue(this.sNotifText);
            oDialog.open();
        },

        onCloseNotifDialog: function () {
            const sDeviationText = this.byId("deviationLongtext").getValue();
            this.byId("notifDialog").close();

            this.createNotification(sDeviationText);


            // call Function Notification aanmaken
            // this.saveAnswers();
        },

        notifDialogEscapeHndlr: function (pEscapePending) {
            pEscapePending.reject();
        },

        onOpenComposedItemDialog: function (oEvent) {
            const sBindingPath = oEvent.getSource().getBindingContext().getPath();

            this.oComposedItemDialogController.openDialog(sBindingPath);
        },

        onCloseComposedItemDialog(oEvent) {
            const sPath = this.composedItemDialog.getBindingContext().getPath(),
                oModel = this.getModel();

            oModel.setProperty(sPath + "/QuestionStatus", "Success");

            this.composedItemDialog.close();
        },

        saveAnswers: function () {
            this.getModel().setUseBatch(true);

            let oModel = this.getModel(),
                that = this;

            this.addComposedItemsAnswers();

            console.log(this.aNewEntries);

            this.aNewEntries.forEach(function (oNewEntry) {
                oModel.createEntry('/AnswerSet', {
                    // groupId: "answerGroup",
                    properties: oNewEntry
                });
                // oModel.createEntry("/AnswerSet", oNewEntry);
            });

            const oQuantityInput = this.byId("inpQuantity");
            const sQuantityValue = parseInt(oQuantityInput.getValue());

            if (oModel.hasPendingChanges()) {
                console.log("pending changes");
                // oModel.setUseBatch(true);
                that.getView().setBusy(true);
                oModel.submitChanges({
                    // groupId: "answerGroup",
                    success: function (oData, response) {
                        that.getView().setBusy(false);
                        // oModel.setUseBatch(false);

                        // MessageToast.show(this.getResourceBundle().getText("msgAnswersSaved"));

                        const newOpenQuantity = sQuantityValue ? that.getView().getBindingContext().getProperty("OpenQuantity") - sQuantityValue : that.getView().getBindingContext().getProperty("OpenQuantity") - 1;

                        // console.log(newOpenQuantity);
              

                        // return;

                        // if (newOpenQuantity <= 0) {
                        //     // this.getModel("objectView").setProperty("/transferFlexAnswers", false);
                        //     // this.onNavBack(true);
                        //     // this.getRouter().navTo("worklist", {}, true);
                        //     // that.getRouter().navTo("worklist");
                        //     // history.go(-2);
                        //     // history.back();

                        //     this.getRouter().navTo("worklist", {}, true);
                        // } else {
                        //     // this.getModel("objectView").setProperty("/transferFlexAnswers", true);
                        //     this.refreshEntry();
                        //     that.getView().getModel().refresh();
                        //     // this.getModel().refresh();
                        //     // location.reload();
                        // }

                        // that.getView().setBusy(false);

                        if (oData.__batchResponses) {
                            if (oData.__batchResponses[0].__changeResponses) {
                                let iNumberOfLines = oData.__batchResponses[0].__changeResponses.length;
                                if (iNumberOfLines !== 0) {
                                    // let sMessage = JSON.parse(oData.__batchResponses[0].__changeResponses[0].headers["sap-message"]).message;
                                    MessageToast.show(this.getResourceBundle().getText("msgAnswersSaved"));

                                    // if (oViewData.serialFlex) {
                                    if (newOpenQuantity <= 0) {
                                        this.getModel("objectView").setProperty("/transferFlexAnswers", false);
                                        // this.onNavBack(true);
                                        // this.getRouter().navTo("worklist", {}, true);
                                        // this.getRouter().navTo("worklist");
                                        // history.go(-1);
                                        this.getRouter().navTo("worklist", {}, true);
                                    } else {
                                        this.getModel("objectView").setProperty("/transferFlexAnswers", true);
                                        this.refreshEntry();
                                        that.getView().getModel().refresh();
                                        // this.getModel().refresh();
                                        // location.reload();
                                    }
                                    // } else {
                                    //     console.log("nav back on no serial flex");
                                    //     this.onNavBack(true);
                                    // }
                                }
                            } else if (oData.__batchResponses[0].response) {
                                // let sErrorMessage = JSON.parse(oData.__batchResponses[0].response.body).error.message.value;
                                // MessageBox.error(sErrorMessage);
                                this.getRouter().navTo("worklist", {}, true);
                            }
                        }

                    }.bind(this),
                    error: function (oError) {
                        // oModel.setUseBatch(false);
                        console.log(oError);
                        that.getView().setBusy(false);
                        that.removeAnswersFromModel();
                    }.bind(this)
                });

                // if (newOpenQuantity <= 0) {
                //     // this.getModel("objectView").setProperty("/transferFlexAnswers", false);
                //     // this.onNavBack(true);
                //     // this.getRouter().navTo("worklist", {}, true);
                //     // that.getRouter().navTo("worklist");
                //     // history.go(-2);
                //     // history.back();

                //     this.getRouter().navTo("worklist", {}, true);
                // } else {
                //     // this.getModel("objectView").setProperty("/transferFlexAnswers", true);
                //     this.refreshEntry();
                //     that.getView().getModel().refresh();
                //     // this.getModel().refresh();
                //     // location.reload();
                // }
            } else {
                console.log("no pending changes");
            }
        },

        removeAnswersFromModel: function () {
            // remove all created answer entries from model. They will be re-created when pressing the save button again.
            // otherwise each answer will be duplicated on the next attempt to save when a technical error has occurred
            let oModel = this.getModel();
            let oChanges = oModel.getPendingChanges();
            let aChangePaths = [];
            for (const sEntryPath in oChanges) {
                if (sEntryPath.search("AnswerSet") !== -1) {
                    aChangePaths.push("/" + sEntryPath);
                    ("removed answer: " + sEntryPath);
                }
            }

            oModel.resetChanges(aChangePaths);
        },

        _onObjectMatched: function (oEvent) {
            let sObjectId = oEvent.getParameter("arguments").objectId;
            this._bindView("/ZOPEN_DELIVERY_OVERVIEW_GA" + sObjectId);
        },

        _bindView: function (sObjectPath) {
            let oViewModel = this.getModel("objectView");

            this.getView().bindElement({
                path: sObjectPath,
                parameters: {
                    expand: 'to_MamoCharact/to_Answers,to_MamoCharact/to_AnswersDisplay,to_ComposedItems'
                },
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        oViewModel.setProperty("/busy", true);
                    },
                    dataReceived: function (oEvent) {
                        oViewModel.setProperty("/busy", false);
                        this.determineFlexScenario();
                    }.bind(this)
                }
            });
        },

        _onBindingChange: function () {
            this.determineFlexScenario();

            let oView = this.getView(),
                oViewModel = this.getModel("objectView"),
                oElementBinding = oView.getElementBinding();

            // No data for the binding
            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("objectNotFound");
                return;
            }


            let bComposedItems = false;
            if (this.byId("compItemsTable").getItems().length > 0) {
                bComposedItems = true;
            }
            this.getModel("objectView").setProperty("/composedItems", bComposedItems);
            let oPage = this.byId("page");
            if (bComposedItems) {
                oPage.setSelectedSection("sectionComposedItems");
            } else {
                oPage.setSelectedSection("sectionSerialnumber");
            }

            let oResourceBundle = this.getResourceBundle(),
                oObject = oView.getBindingContext().getObject(),
                sObjectId = oObject.SerialNumber,
                sObjectName = oObject.ZOPEN_DELIVERY_OVERVIEW_GA;

            oViewModel.setProperty("/busy", false);
            oViewModel.setProperty("/shareSendEmailSubject",
                oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
            oViewModel.setProperty("/shareSendEmailMessage",
                oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
        },

        refreshEntry: async function () {
            //reload all view data to get actual Quantity values
            this.getView().getElementBinding().refresh();

            // reset question lines to default
            this.byId("questionTableMain").updateAggregation("items");

            // reset serialnumber
            this.determineFlexScenario()

        },

        determineFlexScenario: function () {
            let oViewModel = this.getModel("objectView");
            const context = this.getView().getBindingContext();

            if (!context) {
                return
            };

            let oObject = context.getObject();

            const BulkDelivery = this.getView().getBindingContext().getProperty("BulkDelivery");

            oViewModel.setProperty("/serialFlex", !BulkDelivery);
            // reset serialnumber
            oViewModel.setProperty("/serialValid", false);
            oViewModel.setProperty("/serialState", 'None');
            oViewModel.setProperty("/newSerialnumber", '');
            oViewModel.setProperty("/vendorSerialValid", false);
            oViewModel.setProperty("/vendorSerialState", 'None');
            oViewModel.setProperty("/vendorSerialnumber", '');
            oViewModel.setProperty("/licensePlate", '');
            oViewModel.setProperty("/licensePlateValid", false);
            oViewModel.setProperty("/licensePlateState", 'None');
            oViewModel.setProperty("/vin", '');
            oViewModel.setProperty("/vinValid", false);
            oViewModel.setProperty("/vinState", 'None');
            oViewModel.setProperty("/quantityValid", false);
            oViewModel.setProperty("/openQuantity", oObject.OpenQuantity);

            this.byId("inpQuantity").setValue("");
            this.byId("inpQuantity").setValueState("None");
        },

        validateSerialnumber: async function () {
            const oSerialInput = this.byId("serialInput");

            let oObject = this.getView().getBindingContext().getObject();
            return new Promise((resolve, reject) => {
                if (oSerialInput.getBusy()) {
                    resolve();
                    return;
                } else {
                    oSerialInput.setBusy(true);
                }

                this.getModel().callFunction("/ValidateSerialnumber", {
                    method: "GET",
                    urlParameters: {
                        Delivery: oObject.DeliveryDocument,
                        DeliveryPosnr: oObject.DeliveryPosition,
                        ComposedItemPosnr: "",
                        SerialNumber: this.getModel("objectView").getProperty("/newSerialnumber")
                    },
                    success: function (oData, response) {
                        oSerialInput.setBusy(false);
                        let oModel = this.getModel("objectView");
                        if (!oData.Valid) {
                            // MessageBox.warning(oData.Reason, {
                            //     title: this.getResourceBundle().getText("msgInvalidSerialNumber")
                            // });

                            const oHeader = new Bar({
                                contentLeft: [
                                    new Icon({
                                        src: "sap-icon://message-warning",
                                        // make it red-colored like the MessageBox warning
                                        // color: "sapUiIconColorCritical",
                                        color: "orange",
                                        size: "1.25rem"
                                    })
                                ],
                                contentMiddle: [
                                    new Title({ text: this.getResourceBundle().getText("msgInvalidSerialNumber") })
                                ]
                            });

                            if (!this._oSerialDialog) {

                                this._oSerialDialog = new Dialog({
                                    customHeader: oHeader,
                                    contentWidth: "30rem",
                                    title: this.getResourceBundle().getText("msgInvalidSerialNumber"),
                                    content: [
                                        new Panel({
                                            content: [
                                                new Text({ text: oData.Reason })
                                            ]
                                        }).addStyleClass("sapUiContentPadding")
                                    ],
                                    endButton: new Button({
                                        text: this.getResourceBundle().getText("lblCorrectInput"),
                                        press: function () {
                                            this._oSerialDialog.close();
                                        }.bind(this)
                                    }),
                                    beginButton: new Button({
                                        text: this.getResourceBundle().getText("lblCreateIncidentSN"),
                                        type: ButtonType.Emphasized,
                                        press: function () {
                                            this._oSerialDialog.close();
                                            this.onIncidentType06();
                                        }.bind(this)
                                    })
                                });
                                // make sure it is destroyed with the view
                                this.getView().addDependent(this._oSerialDialog);
                            }

                            this._oSerialDialog.open();

                            oModel.setProperty("/serialState", "Error");
                        } else {
                            oModel.setProperty("/serialState", "Success");
                        }



                        oModel.setProperty("/serialValid", oData.Valid);
                        resolve();
                    }.bind(this),
                    error: function (oError) {
                        oSerialInput.setBusy(false);
                    }.bind(this)
                });

            })
        },

        onNoSupplierSerialNumber: function () {
            this.byId("vendorSerialInput").setValue("N/A");
            this.validateVendorSerialnumber();
        },

        validateVendorSerialnumber: function () {
            const oModel = this.getModel("objectView");
            const oDeliveryData = this.getView().getBindingContext().getObject();
            const sSerial = oModel.getProperty("/newSerialnumber");
            const sMaterial = oDeliveryData.MaterialNumber;
            const sSubgroup = oDeliveryData.SubGroup;
            const sVendorSerial = oModel.getProperty("/vendorSerialnumber");
            const sSupplierSerialnumber = oDeliveryData.SupplierSerialnumber;

            oModel.setProperty("/vendorSerialValidLichn", false);
            oModel.setProperty("/vendorSerialValidComparison", false);

            console.log(oDeliveryData);
            console.log(sMaterial, sSubgroup);

            let bValid = true,
                sState = "Success";

            if (!oDeliveryData.DeliveryDocument || oDeliveryData.BulkDelivery) {
                return bValid;
            }

            if (oDeliveryData.BulkDelivery) {
                return bValid;
            }

            if (sVendorSerial === sSerial || sVendorSerial === "") {
                bValid = false;
                sState = "Error";

                MessageBox.warning(
                    this.getResourceBundle().getText("msgInvalidSupplierSerialNumber"), {
                });

                oModel.setProperty("/vendorSerialState", sState);
                oModel.setProperty("/vendorSerialValid", bValid)
                console.log("empty vendor serial number")
                return bValid;
            }


            const minimumLength = 4;

            if (sVendorSerial.length < minimumLength && sVendorSerial != "N/A") {
                bValid = false;
                sState = "Error";

                MessageBox.warning(
                    this.getResourceBundle().getText("msgInvalidSupplierSerialNumber"), {
                });

                oModel.setProperty("/vendorSerialState", sState);
                oModel.setProperty("/vendorSerialValid", bValid)
                console.log("invalid length for vendor serial number");
                return bValid;
            }

            if (sSubgroup.includes(sVendorSerial)) {
                bValid = false;
                sState = "Error";

                MessageBox.warning(
                    this.getResourceBundle().getText("msgInvalidSupplierSerialNumber"), {
                });

                oModel.setProperty("/vendorSerialState", sState);
                oModel.setProperty("/vendorSerialValid", bValid);
                console.log("vendor serial number contains subgroup")
                return bValid;
            }

            if (sVendorSerial.length >= 8 && sMaterial.includes(sVendorSerial)) {
                bValid = false;
                sState = "Error";

                MessageBox.warning(
                    this.getResourceBundle().getText("msgInvalidSupplierSerialNumber"), {
                });

                oModel.setProperty("/vendorSerialState", sState);
                oModel.setProperty("/vendorSerialValid", bValid);
                console.log("vendor serial number contains material or material group");
                return bValid;
            }

            if (sVendorSerial.includes("qr.group.boels.com")) {
                bValid = false;
                sState = "Error";

                MessageBox.warning(
                    this.getResourceBundle().getText("msgInvalidSupplierSerialNumber"), {
                });

                oModel.setProperty("/vendorSerialState", sState);
                oModel.setProperty("/vendorSerialValid", bValid);
                console.log("vendor serial number contains qr code prefix")
                return bValid;
            }

            if (sSupplierSerialnumber != "" && sSupplierSerialnumber != sVendorSerial) {
                bValid = false;
                sState = "Error";

                MessageBox.warning(
                    this.getResourceBundle().getText("msgInvalidSupplierBatch"), {
                });

                oModel.setProperty("/vendorSerialState", sState);
                oModel.setProperty("/vendorSerialValid", bValid)
                return bValid;
            }

            oModel.setProperty("/vendorSerialState", sState);
            oModel.setProperty("/vendorSerialValid", bValid)
            return bValid;
        },

        validateVIN: function () {
            const oModel = this.getModel("objectView");
            const sVIN = oModel.getProperty("/vin");

            let bValid = true;
            let sState = "Success";
            let sReason = "";

            // Check length first (must be exactly 17 characters)
            if (sVIN.length !== 17) {
                bValid = false;
                sState = "Error";
                sReason = this.getResourceBundle().getText("msgVINInvalidLength");
            }
            // Only check for forbidden characters if length is correct
            else {
                const forbiddenChars = /[IOQ]/i;
                if (forbiddenChars.test(sVIN)) {
                    bValid = false;
                    sState = "Error";
                    sReason = this.getResourceBundle().getText("msgVINInvalidChars");
                }
            }

            if (!bValid) {
                // Destroy old dialog if it exists to ensure fresh content
                if (this._oVINDialog) {
                    this._oVINDialog.destroy();
                    this._oVINDialog = null;
                }

                const oHeader = new Bar({
                    contentLeft: [
                        new Icon({
                            src: "sap-icon://message-warning",
                            color: "orange",
                            size: "1.25rem"
                        })
                    ],
                    contentMiddle: [
                        new Title({ text: this.getResourceBundle().getText("msgInvalidVIN") })
                    ]
                });

                this._oVINDialog = new Dialog({
                    customHeader: oHeader,
                    title: this.getResourceBundle().getText("msgInvalidVIN"),
                    content: [
                        new Panel({
                            content: [
                                new Text({ text: sReason })
                            ]
                        }).addStyleClass("sapUiContentPadding")
                    ],
                    endButton: new Button({
                        text: this.getResourceBundle().getText("lblCorrectInput"),
                        press: function () {
                            this._oVINDialog.close();
                        }.bind(this)
                    }),
                    beginButton: new Button({
                        text: this.getResourceBundle().getText("lblCreateIncidentVIN"),
                        type: ButtonType.Emphasized,
                        press: function () {
                            this._oVINDialog.close();
                            this.onIncidentType13();
                        }.bind(this)
                    })
                });
                this.getView().addDependent(this._oVINDialog);

                this._oVINDialog.open();
            }

            oModel.setProperty("/vinState", sState);
            oModel.setProperty("/vinValid", bValid);

            return bValid;
        },

        validateLicensePlate: async function () {
            const oLicensePlateInput = this.byId("licensePlateInput");
            const oModel = this.getModel("objectView");
            let sLicensePlate = oModel.getProperty("/licensePlate");

            // Convert to uppercase
            if (sLicensePlate) {
                sLicensePlate = sLicensePlate.toUpperCase();
                oModel.setProperty("/licensePlate", sLicensePlate);
            }

            // Skip validation if input is empty
            if (!sLicensePlate || sLicensePlate.trim() === "") {
                oModel.setProperty("/licensePlateState", "None");
                oModel.setProperty("/licensePlateValid", false);
                return;
            }

            const oObject = this.getView().getBindingContext().getObject();

            return new Promise((resolve, reject) => {
                if (oLicensePlateInput.getBusy()) {
                    resolve();
                    return;
                } else {
                    oLicensePlateInput.setBusy(true);
                }

                this.getModel().callFunction("/ValidateLicensePlate", {
                    method: "GET",
                    urlParameters: {
                        Delivery: oObject.DeliveryDocument,
                        DeliveryPosnr: oObject.DeliveryPosition,
                        ComposedItemPosnr: "",
                        LicensePlate: sLicensePlate,
                        Depot: oObject.Depot
                    },
              
                    success: function (oData, response) {
                        oLicensePlateInput.setBusy(false);

                        if (!oData.Valid) {
                            const oHeader = new Bar({
                                contentLeft: [
                                    new Icon({
                                        src: "sap-icon://message-warning",
                                        color: "orange",
                                        size: "1.25rem"
                                    })
                                ],
                                contentMiddle: [
                                    new Title({ text: this.getResourceBundle().getText("msgInvalidLicensePlate") })
                                ]
                            });

                            if (this._oLicensePlateDialog) {
                                this._oLicensePlateDialog.destroy();
                                this._oLicensePlateDialog = null;
                            }

                            this._oLicensePlateDialog = new Dialog({
                                customHeader: oHeader,
                                title: this.getResourceBundle().getText("msgInvalidLicensePlate"),
                                content: [
                                    new Panel({
                                        content: [
                                            new Text({ text: oData.Reason })
                                        ]
                                    }).addStyleClass("sapUiContentPadding")
                                ],
                                endButton: new Button({
                                    text: this.getResourceBundle().getText("lblCorrectInput"),
                                    press: function () {
                                        this._oLicensePlateDialog.close();
                                    }.bind(this)
                                })
                            });
                            this.getView().addDependent(this._oLicensePlateDialog);

                            this._oLicensePlateDialog.open();

                            oModel.setProperty("/licensePlateState", "Error");
                        } else {
                            oModel.setProperty("/licensePlateState", "Success");
                        }

                        oModel.setProperty("/licensePlateValid", oData.Valid);
                        resolve();
                    }.bind(this),
                    error: function (oError) {
                        oLicensePlateInput.setBusy(false);
                        oModel.setProperty("/licensePlateState", "Error");
                        oModel.setProperty("/licensePlateValid", false);
                        resolve();
                    }.bind(this)
                });
            });
        },

        validateQuantity: function () {
            const oObject = this.getView().getBindingContext().getObject();
            const sOpenQuantity = parseInt(oObject.OpenQuantity);
            let bValid = true;

            if (!oObject.BulkDelivery) {
                return bValid;
            }

            let sValueState = "None";
            const oQuantityInput = this.byId("inpQuantity");
            const oQuantityInputIcon = this.byId("inpQuantityIcon");
            const sQuantityValue = parseInt(oQuantityInput.getValue());

            if (sQuantityValue > sOpenQuantity) {
                bValid = false;
            }
            if (sQuantityValue === 0) {
                bValid = false;
            }
            if (sQuantityValue < 0) {
                bValid = false;
            }

            if (!bValid) {
                sValueState = "Error";
            }
            oQuantityInput.setValueState(sValueState);
            oQuantityInputIcon.setSrc(formatter.validStatusIcon(bValid));
            oQuantityInputIcon.setColor(formatter.validStatusColor(bValid));
            this.getModel("objectView").setProperty("/quantityValid", bValid);
            return bValid;
        },

        transferFlexAnswers: function () {
            let oObject = this.getView().getBindingContext().getObject();

            ("Start TransferFlexAnswersToGa")

            this.getModel().callFunction("/TransferFlexAnswersToGa", {
                method: "GET",
                urlParameters: {
                    Delivery: oObject.DeliveryDocument,
                    DeliveryPosnr: oObject.DeliveryPosition
                },
                success: function (oData, response) {
                    oData.Success ? console.log("TransferFlexAnswersToGa Success") : console.log("TransferFlexAnswersToGa Failed");
                }.bind(this),
            });

        }
    });

});

function formatName(firstName, lastName) {
    if (firstName) {
        return `${lastName}, ${firstName}`;
    } else {
        return lastName;
    }
}
