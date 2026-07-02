sap.ui.define([
    "sap/ui/core/Fragment",
    "../model/formatter",
    "sap/ui/model/json/JSONModel",
    "eu/aiden/ga/goodsacceptance/controller/Question",
    "sap/m/MessageBox",
], function (Fragment, formatter, JSONModel, Question, MessageBox) {
    "use strict";

    return {
        onInit: function (oParentController) {
            // Initialize the container to store all compItems Answers
            // Each CompItem has its own property, identified by the SalesOrderPosition of the compItem
            this.formatter = formatter;

            this.oAnswers = {};


            this.oParentController = oParentController
            const sViewId = this.oParentController.getView().getId()

            this.oQuestion = Question;
            this.oQuestion.viewId = sViewId;
            this.oQuestion.controller = this;

            let oViewModel = new JSONModel({
                quantityValid: false,
                serialValid: false,
                serialState: 'Error',
                newSerialnumber: '',
            });
            this.oParentController.setModel(oViewModel, "compItemDial");

            this.composedItemDialog = Fragment.load({
                id: sViewId,
                name: "eu.aiden.ga.goodsacceptance.fragments.ComposedItemDialog",
                type: "XML",
                controller: this
            })

            this.composedItemDialog.then((oDialog) => {
                oParentController.getView().applySettings({ "dependents": oDialog })  // assign oParentController as "parent" to oDialog -> oDialog.getParent() will now return the oParentController (otherwise it would return null and not work correctly)
                this.composedItemDialog = oDialog;
            });
        },

        _questionLineFactory: function (sId, oContext) {
            let bPhone = this.oParentController.getOwnerComponent().getModel("device").getProperty("/system/phone");
            let oLine = this.oQuestion.createQuestionLine(sId, oContext, bPhone);

            return oLine;
        },

        openDialog: function (sBindingPath) {
            let oCompItmModel = this.oParentController.getModel("compItemDial");
            oCompItmModel.setProperty("/quantityValid", false);
            oCompItmModel.setProperty("/serialState", "None");
            oCompItmModel.setProperty("/newSerialnumber", "");
            oCompItmModel.setProperty("/serialValid", false);
            this.oParentController.byId("compItem--inpQuantity").setValue("");
            this.oParentController.byId("compItem--inpQuantity").setValueState("None");

            this.composedItemDialog.bindElement(sBindingPath);

            this.oParentController.byId("questionTableCompItem").bindAggregation("items", {
                path: sBindingPath + "/to_MamoCharact",
                parameters: {
                    expand: 'to_Answers,to_AnswersDisplay'
                },
                factory: this._questionLineFactory.bind(this),
                sorter: { path: 'SortField', descending: false },
                events: {
                    dataReceived: function () {
                        // oDialog.update();
                    }
                }
            });

            this.composedItemDialog.open();
        },

        closeComposedItemDialog: function () {
            // const sPath = this.composedItemDialog.getBindingContext().getPath(),
            // oModel = this.oParentController.getModel();


            this.composedItemDialog.close();
        },

        onScanSuccess: function (oEvent) {
            if (oEvent.getParameter("cancelled")) {
                MessageToast.show("Scan cancelled", { duration: 1000 });
            } else {
                if (oEvent.getParameter("text")) {
                    let sValue = oEvent.getParameter("text");
                    if (sValue.search("/u/" !== -1)) {                  // "/u/" geeft aan dat er een uniek serienummer in de QR zit
                        let sSerial = sValue.split("/").pop(); //Laatste deel van de url string uit QR is het serienummer
                        this.oParentController.getModel("compItemDial").setProperty("/newSerialnumber", sSerial);
                        this.validateSerialnumber();
                    } else {
                        MessageToast.show("No Serialnumber found");
                    }
                }
            }
        },

        validateSerialnumber: async function () {
            const oSerialInput = this.oParentController.byId("inpSerialCompItem");
            let oObject = this.oParentController.getView().getBindingContext().getObject();
            let oCompItem = this.composedItemDialog.getBindingContext().getObject();
            let oCompItmModel = this.oParentController.getModel("compItemDial");

            return new Promise((resolve, reject) => {
                if (oSerialInput.getBusy()) {
                    resolve();
                    return;
                } else {
                    oSerialInput.setBusy(true);
                }

                this.oParentController.getModel().callFunction("/ValidateSerialnumber", {
                    method: "GET",
                    urlParameters: {
                        Delivery: oObject.DeliveryDocument,
                        DeliveryPosnr: oObject.DeliveryPosition,
                        ComposedItemPosnr: oCompItem.SalesOrderPosition,
                        SerialNumber: oCompItmModel.getProperty("/newSerialnumber")
                    },
                    success: function (oData, response) {
                        oSerialInput.setBusy(false);
                        // let oModel = this.getModel("objectView");
                        if (!oData.Valid) {
                            MessageBox.warning(oData.Reason, {
                                title: this.oParentController.getResourceBundle().getText("msgInvalidSerialNumber")
                            });
                            oCompItmModel.setProperty("/serialState", "Error");
                        } else {
                            oCompItmModel.setProperty("/serialState", "Success");
                            oCompItmModel.setProperty("/serialValid", true);
                        }
                        resolve();
                    }.bind(this),
                    error: function (oError) {
                        oSerialInput.setBusy(false);
                    }.bind(this)
                });

            })
        },

        onOkComposedItemDialog: async function (oEvent) {
            const oDelivery = this.oParentController.getView().getBindingContext().getObject();
            const oCompItem = this.composedItemDialog.getBindingContext().getObject();
            const oCompItemModel = this.oParentController.getModel("compItemDial");

            if (!oCompItem.BulkMaterial) {
                await this.validateSerialnumber();
                if (!oCompItemModel.getProperty("/serialValid")) {
                    // No further processing when serial relevant & the nr is invalid
                    return;
                }
            }

            let aQuestions = this.oParentController.byId("questionTableCompItem").getItems();

            this.aNewEntries = [];
            this.bAllAnswered = true;
            this.bDeviation = false;
            this.aNotifDeviationText = [];

            const oUserInfo = sap.ushell.Container.getService("UserInfo");
            const sFirstName = oUserInfo.getUser().getFirstName();
            const sLastName = oUserInfo.getUser().getLastName();

            for (let oQuestion of aQuestions) {
                let rowNumber = oQuestion.getId().split("questionTableCompItem-")[1];

                let oContext = oQuestion.getBindingContext()
                let oQuestionData = oContext.getObject();
                let oDisplay = oContext.getProperty("to_AnswersDisplay");

                let oAnswerControl = this.oParentController.byId("answerControlCompItem-" + rowNumber);
                let sAnswerValue = oAnswerControl.getAnswer();
                if (oAnswerControl.getDeviation) {
                    if (oAnswerControl.getDeviation()) {
                        this.bDeviation = true;

                        this.aNotifDeviationText.push(oAnswerControl.getDeviationText());
                    }
                }

                let oEntry = {};
                oEntry.Delivery = oDelivery.DeliveryDocument;
                oEntry.DeliveryPosnr = oDelivery.DeliveryPosition;
                oEntry.SalesOrder = oCompItem.SalesOrder;
                oEntry.SalesOrderPosition = oCompItem.SalesOrderPosition;
                oEntry.EquipmentID = '';                         // nog checken!!!
                oEntry.BulkUnique = oCompItem.BulkMaterial ? "0" : "1";
                oEntry.classnum = oQuestionData.classnum;
                oEntry.charact = oQuestionData.Charact;
                oEntry.AnswerValue = sAnswerValue;


                oEntry.bktxt = `${sFirstName} ${sLastName}`;

                if (!oCompItem.BulkMaterial) {
                    oEntry.SerialNumber = oCompItemModel.getProperty("/newSerialnumber");
                }

                if (oDisplay.Required && oDisplay.Visible && sAnswerValue === "") {
                    bAllAnswered = false;
                    oAnswerControl.setValueState(sap.ui.core.ValueState.Error);
                    oAnswerControl.setValueStateText(this.getResourceBundle().getText("msgFillValue"))   //("Vul een waarde in s.v.p.");
                } else {
                    oAnswerControl.setValueState();
                }

                this.aNewEntries.push(oEntry);
            }

            this.bAllAnswered = this.addQuantityAnswer(this.bAllAnswered);
            this.bDeviation = this.getQuantityDeviation(this.bDeviation);

            let sCompItemStatus = "Success";
            if (this.bDeviation) {
                sCompItemStatus = "Error";
            }

            if (!this.bAllAnswered) {
                sap.m.MessageBox.warning(this.oParentController.getResourceBundle().getText("msgFillAllAnswers"), { title: "" });
                return;
            } else {
                let sCompItemPath = this.composedItemDialog.getBindingContext().getPath();
                this.oParentController.getModel().setProperty(sCompItemPath + "/QuestionStatus", sCompItemStatus);

                // Store the answers of this compItem
                this.oAnswers[oCompItem.SalesOrderPosition] = {};
                this.oAnswers[oCompItem.SalesOrderPosition].deviations = this.bDeviation;
                this.oAnswers[oCompItem.SalesOrderPosition].answers = this.aNewEntries;

                // Store the deviation texts
                let sDeviationsText = oCompItem.SalesOrder + " - " + oCompItem.SalesOrderPosition + " ";
                sDeviationsText += oCompItem.MaterialName + " \n";
                this.aNotifDeviationText.forEach(function(sDeviationLine){
                    sDeviationsText += "    " + sDeviationLine + " \n";
                });
                sDeviationsText = this.getQuantityDeviation(sDeviationsText) + "\n";
                this.oAnswers[oCompItem.SalesOrderPosition].deviationText = sDeviationsText + "\n";                

                this.closeComposedItemDialog();
            }
        },

        onQuantityChange: function (oEvent) {
            this.getQuantityDeviation(false);
        },

        addQuantityAnswer: function (bAllAnswered) {
            let bAnswered = true;

            const oDelivery = this.oParentController.getView().getBindingContext().getObject();
            const oCompItem = this.composedItemDialog.getBindingContext().getObject();
            const oCompItemModel = this.oParentController.getModel("compItemDial");

            if (!oCompItem.BulkMaterial) {
                return bAllAnswered;
            }

            let sValueState = "None";
            const oQuantityInput = this.oParentController.byId("compItem--inpQuantity");

            if (oQuantityInput.getValue() === "") {
                sValueState = "Error";
                bAnswered = false;
            }
            oQuantityInput.setValueState(sValueState);

            const oUserInfo = sap.ushell.Container.getService("UserInfo");
            const sFirstName = oUserInfo.getUser().getFirstName();
            const sLastName = oUserInfo.getUser().getLastName();

            if (bAnswered) {
                let oEntry = {};
                oEntry.Delivery = oDelivery.DeliveryDocument;
                oEntry.DeliveryPosnr = oDelivery.DeliveryPosition;
                oEntry.SalesOrder = oCompItem.SalesOrder;
                oEntry.SalesOrderPosition = oCompItem.SalesOrderPosition;
                oEntry.EquipmentID = oDelivery.EquipmentID === '1' ? '' : oDelivery.EquipmentID;
                oEntry.BulkUnique = oCompItem.BulkMaterial ? "0" : "1";
                oEntry.classnum = "";
                oEntry.charact = "WEMNG"
                oEntry.AnswerValue = oQuantityInput.getValue();

                oEntry.bktxt = `${sFirstName} ${sLastName}`;

                // oEntry.SerialNumber // Bulkmaterial so no serialnumber

                this.aNewEntries.push(oEntry);
            } else {
                bAllAnswered = false;
            }

            return bAllAnswered;
        },

        getQuantityDeviation: function (bDeviation) {
            const oCompItem = this.composedItemDialog.getBindingContext().getObject();
            const sOrderedQantity = parseInt(oCompItem.ComponentOrderQuantity);

            if (!oCompItem.BulkMaterial) {
                return bDeviation;
            }

            // let sValueState = "None";
            const oQuantityInput = this.oParentController.byId("compItem--inpQuantity");
            const oQuantityInputIcon = this.oParentController.byId("compItem--inpQuantityIcon");
            const oCompItemModel = this.oParentController.getModel("compItemDial");
            const sQuantityValue = parseInt(oQuantityInput.getValue());
            let bValid = false;

            if (sQuantityValue === sOrderedQantity) {
                bValid = true;
            } else {
                bDeviation = true;
            }
            oQuantityInputIcon.setSrc(formatter.validStatusIcon(bValid));
            oQuantityInputIcon.setColor(formatter.validStatusColor(bValid));

            return bDeviation;
        }
    }
});

function formatName(firstName, lastName) {
    if (firstName) {
        return `${lastName}, ${firstName}`;
    } else {
        return lastName;
    }
}
