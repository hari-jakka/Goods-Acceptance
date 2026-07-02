sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library",
    "sap/m/MessageToast",
], function (Controller, UIComponent, mobileLibrary, MessageToast) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return Controller.extend("eu.aiden.ga.goodsacceptance.controller.BaseController", {
        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Event handler when the share by E-Mail button has been clicked
         * @public
         */
        onShareEmailPress: function () {
            var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
            URLHelper.triggerEmail(
                null,
                oViewModel.getProperty("/shareSendEmailSubject"),
                oViewModel.getProperty("/shareSendEmailMessage")
            );
        },

        onOpenTopdeskInfoDialog: function () {
            this.topdeskInfoDialog ??= this.loadFragment({
                name: "eu.aiden.ga.goodsacceptance.fragments.TopdeskInfo"
            });

            this.topdeskInfoDialog.then((oDialog) =>
                this.openTopdeskInfoDialog(oDialog)
            );
        },

        openTopdeskInfoDialog: function (oDialog) {
            // const oDeviationtext = this.byId("deviationLongtext");
            // let bDeviationtextVisible = false;
            // if (this.sNotifText) {
            //     bDeviationtextVisible = true;
            //     oDeviationtext.setValue(this.sNotifText);
            // } else {
            //     oDeviationtext.setValue("");
            // }
            // oDeviationtext.setVisible(bDeviationtextVisible);

            const that = this;



            // addEventListener('saveAnswers', function () {
            //     that.saveAnswers();
            // });

            // oDialog.open();
            this.incidentTypeDialog08 = this.createTopdeskDialog("incidentTypeDialog08", "08", () => {
                const model = that.getModel();
                model.refresh();

                // if (that.saveAnswers) {
                //     that.saveAnswers();
                // }

                // console.log("firing event");

                // dispatchEvent(new Event("saveAnswers"));
                that.saveAnswers();
            }, () => {
            });
            this.incidentTypeDialog08.open();
        },

        onCloseTopdeskInfoDialog: function (oEvent) {
            this.byId("topdeskInfoDialog").close();

            if (this.saveAnswers) {
                this.saveAnswers();
            }
        },

        onNavToTopDesk: function (evt) {
            const sUrl = "https://boels.topdesk.net/tas/public/ssp/content/serviceflow?unid=0d605fc75d7d447a88e13f714396adb3&openedFromService=true"
            URLHelper.redirect(sUrl, true);
        },


        createTopdeskDialog: function (id, incidentType, onCreated, onCancel) {
            const existing = sap.ui.getCore().byId(id);
            if (existing) {
                existing.destroy();
            }

            const that = this;

            // Define available controls statically

            const context = this.getView().getBindingContext();

            const depot = new sap.m.Input({
                cols: 40
            });
            const defaultDepot = localStorage.getItem("defaultDepot");

            if (defaultDepot) {
                depot.setValue(defaultDepot);
                depot.setEnabled(false);
            }

            const depot_prefilled = new sap.m.Input(null, { enabled: false, required: true });
            depot_prefilled.setEnabled(false);
            if (context) depot_prefilled.setValue(context.getProperty("Depot"));

            const supplier_prefilled = new sap.m.Input({
                cols: 40,
                required: true
            });
            supplier_prefilled.setEnabled(false);
            if (context) supplier_prefilled.setValue(`${context.getProperty("Supplier")} - ${context.getProperty("SupplierName")}`);

            const delivery_reference_prefilled = new sap.m.Input({
                cols: 40,
                required: true
            });
            delivery_reference_prefilled.setEnabled(false);
            if (context) delivery_reference_prefilled.setValue(`${context.getProperty("DeliveryDocument")} - ${context.getProperty("DeliveryPosition")}`);

            const material_prefilled = new sap.m.Input({
                cols: 40,
                required: true
            });
            material_prefilled.setEnabled(false);
            if (context) material_prefilled.setValue(`${context.getProperty("MaterialNumber")}  - ${context.getProperty("MaterialDescription")}`);

            const delivered_serial_numbers = new sap.m.Input({
                cols: 40,
                required: true
            });
            if (context) delivered_serial_numbers.setValue(this.byId("serialInput")?.getValue());

            const serialNumber = this.byId("serialInput")?.getValue();

            const delivered_vin = new sap.m.Input({
                cols: 40
            });
            if (context) delivered_vin.setValue(this.byId("vinInput")?.getValue());

            const showQuantityOrSerialNumber = context ? context.getProperty("ProcessIndicator") == "1" : false;

            const delivered_serial_numbers_disabled = new sap.m.Input({
                cols: 40
            });
            delivered_serial_numbers_disabled.setEnabled(false);
            if (context) delivered_serial_numbers_disabled.setValue(this.byId("serialInput")?.getValue());

            const wrong_spec_remarks = new sap.m.TextArea({
                cols: 40,
                required: true
            });
            if (this.aNotifDeviationText) wrong_spec_remarks.setValue(this.aNotifDeviationText.join("\n"));

            const quantity_incorrect = new sap.m.Input({
                cols: 40,
            });
            quantity_incorrect.setValue(this.byId("inpQuantity")?.getValue());

            const attachment = new sap.ui.unified.FileUploader({
                multiple: true,
                change: (oEvent) => {
                    const files = oEvent.getParameter("files");

                    const promises = [];

                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];

                        const promise = new Promise((resolve, reject) => {
                            var reader = new FileReader();
                            reader.onload = function (evt) {
                                const content = `${file.name}:${evt.target.result}`;

                                resolve(content);
                            };
                            reader.readAsDataURL(file);
                        });
                        promises.push(promise);
                    };

                    Promise.all(promises).then(contents => {
                        attachment.content = contents.join("#");
                    });

                }
            });

            // Create lookup object per incident type

            const lookup = {
                "01": [
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblDepot"),
                        control: depot
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblRemarks01"),
                        control: new sap.m.TextArea({
                            cols: 40,
                            required: true
                        })
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblAttachments01"),
                        control: attachment
                    }
                ],
                "05": [
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblDepot"),
                        control: depot_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblSupplier"),
                        control: supplier_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblDeliveryReference"),
                        control: delivery_reference_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblMaterial"),
                        control: material_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblRemarks"),
                        control: new sap.m.TextArea({
                            cols: 40,
                            required: false
                        })
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblAttachments05"),
                        control: attachment
                    }
                ],
                "06": [
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblDepot"),
                        control: depot_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblSupplier"),
                        control: supplier_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblDeliveryReference"),
                        control: delivery_reference_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblMaterial"),
                        control: material_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblDeliveredSerialNumbers"),
                        control: delivered_serial_numbers,
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblRemarks"),
                        control: new sap.m.TextArea({
                            cols: 40
                        })
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblAttachments06"),
                        control: attachment
                    }
                ],
                "07": [
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblDepot"),
                        control: depot_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblSupplier"),
                        control: supplier_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblDamagedItem"),
                        control: new sap.m.Input({
                            cols: 40,
                            required: true
                        })
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblQTYDamaged"),
                        control: new sap.m.Input({
                            cols: 40,
                            required: true
                        })
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblSerialNumberDamaged"),
                        control: new sap.m.Input({
                            cols: 40,
                            required: true
                        })
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblRemarks"),
                        control: new sap.m.TextArea({
                            cols: 40,
                            required: true
                        })
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblAttachments07"),
                        control: attachment
                    }
                ],
                "08": [
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblDepot"),
                        control: depot_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblSupplier"),
                        control: supplier_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblDeliveryReference"),
                        control: delivery_reference_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblMaterial"),
                        control: material_prefilled
                    },
                    showQuantityOrSerialNumber ? {
                        label: this.getModel("i18n").getResourceBundle().getText("lblSerialNumbersIncorrect"),
                        control: delivered_serial_numbers_disabled
                    } :
                        {
                            label: this.getModel("i18n").getResourceBundle().getText("lblQTYIncorrect"),
                            control: quantity_incorrect
                        },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblRemarks"),
                        control: wrong_spec_remarks
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblAttachments08"),
                        control: attachment
                    }
                ],
                "09": [
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblDepot"),
                        control: depot_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblSupplier"),
                        control: supplier_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblSerialNumbersIncorrect"),
                        control: new sap.m.Input()
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblQTYIncorrect"),
                        control: new sap.m.Input()
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblTechnicalDefect"),
                        control: new sap.m.Input()
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("Can it be repaired on site?"),
                        control: new sap.m.Input()
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("Rental ready?"),
                        control: new sap.m.ComboBox({
                            width: "200px",
                            placeholder: "Select an option",
                            items: [
                                new sap.ui.core.Item({ key: "yes", text: "Yes" }),
                                new sap.ui.core.Item({ key: "no", text: "No" })
                            ],
                            selectedKey: "yes",
                            required: true
                        })
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblRemarks"),
                        control: new sap.m.TextArea({
                            required: true
                        })
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblAttachments09"),
                        control: attachment
                    }
                ],
                "13": [
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblDepot"),
                        control: depot_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblSupplier"),
                        control: supplier_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblDeliveryReference"),
                        control: delivery_reference_prefilled
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblMaterial"),
                        control: material_prefilled
                    },
                    ...(serialNumber ? [{
                        label: this.getModel("i18n").getResourceBundle().getText("lblDeliveredSerialNumbers"),
                        control: delivered_serial_numbers_disabled,
                    }] : []),
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblVIN"),
                        control: delivered_vin
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblRemarks"),
                        control: new sap.m.TextArea({
                            cols: 40,
                            required: true
                        })
                    },
                    {
                        label: this.getModel("i18n").getResourceBundle().getText("lblAttachments13"),
                        control: attachment
                    }
                ]
            };

            const items = [];

            for (const value of lookup[incidentType]) {
                items.push(new sap.m.Label({ text: `${value.label}:`, required: value.control.getRequired ? value.control.getRequired() : false }));
                items.push(value.control);
            }

            var oDialog = new sap.m.Dialog({
                id,
                title: "TOPdesk",
                state: "Information",
                content: [
                    new sap.m.VBox({
                        items
                    }).addStyleClass("sapUiMediumMargin")
                ],
                beginButton: new sap.m.Button({
                    text: this.getResourceBundle().getText("lblCreate"),
                    press: function (sEvent) {
                        const validated = lookup[incidentType].reduce((value, item) => {
                            if (value) return value;

                            if (item.control.getRequired && item.control.getRequired() && !item.control.getValue()) {
                                return item;
                            }

                            return value;
                        }, null);

                        if (validated != null) {
                            MessageToast.show(`${that.getModel("i18n").getResourceBundle().getText("lblPleaseFillIn")} ${validated.label}`);
                            return;
                        }

                        if (!attachment.content) {
                            MessageToast.show(`${that.getModel("i18n").getResourceBundle().getText("lblPleaseFillIn")} ${that.getModel("i18n").getResourceBundle().getText("lblAttachments")}`);
                            return;
                        }

                        const longText = that.formatNotificationLongText(lookup[incidentType].map(item => {
                            return {
                                name: item.label,
                                value: item.control.getValue()
                            }
                        }));

                        const oUserInfo = sap.ushell.Container.getService("UserInfo");
                        const sFirstName = oUserInfo.getUser().getFirstName();
                        const sLastName = oUserInfo.getUser().getLastName();
                        const name = formatName(sFirstName, sLastName);

                        const source = sEvent.getSource();
                        source.setBusy(true);

                        that.createNotification({
                            incidentType,
                            depot: incidentType == "01" ? depot.getValue() : depot_prefilled.getValue(),
                            longText: longText,
                            delivery: context ? context.getProperty("DeliveryDocument") : "",
                            posnr: context ? context.getProperty("DeliveryPosition") : "",
                            serialNumber: serialNumber,
                            email: sap.ushell.Container.getService("UserInfo")?.getEmail() || "john.doe@aiden.eu",
                            attachment: attachment.content,
                            name,
                            success: function (oData, response) {
                                console.log(response, oData);

                                if (!oData.Success) {
                                    MessageToast.show(oData.Message || that.getModel("i18n").getResourceBundle().getText("msgIncidentCreatedSuccesfully"));
                                    source.setBusy(false);
                                    return;
                                }

                                sap.ui.getCore().byId(id).close();

                                MessageToast.show(`${that.getModel("i18n").getResourceBundle().getText("msgIncidentCreatedSuccesfully")}: ${oData.Message}`);

                                source.setBusy(false);

                                if (onCreated) onCreated();
                            }.bind(this),
                        });

                    }
                }),
                endButton: new sap.m.Button({
                    text: this.getResourceBundle().getText("lblClose"),
                    press: function () {
                        sap.ui.getCore().byId(id).close();

                        if (onCancel) onCancel();
                    }
                })
            });
            return oDialog;
        },

        createNotification: function (
            {
                incidentType = "01",
                email,
                depot,
                longText,
                delivery = "",
                posnr = "",
                attachment = "",
                name = "",
                serialNumber = "",
                success = () => { },
                error = () => { }
            } = {}
        ) {
            const payload = {
                IncidentType: encodeURIComponent(incidentType),
                Delivery: encodeURIComponent(delivery),
                DeliveryPosnr: encodeURIComponent(posnr),
                Equipment: encodeURIComponent(""), // TODO: Remove this from interface
                SerialNumber: encodeURIComponent(serialNumber),
                Depot: encodeURIComponent(depot),
                LongText: encodeURIComponent(longText),
                FileContent: encodeURIComponent(attachment),
                Email: encodeURIComponent(email),
                Name: encodeURIComponent(name)
            };

            const that = this;

            that.getModel().setUseBatch(true);
            this.getModel().callFunction("/CreateRejectionNotif", {
                method: "POST",
                urlParameters: payload,
                success: function (oData, response) {
                    that.getModel().setUseBatch(false);
                    success(oData, response);
                },
                error
            });
        },

        formatNotificationLongText: function (items) {
            return items
                .map(({ name, value }) => {
                    return `<strong>${name}</strong>: ${value}`;
                })
                .join("<br/>")
        },
    });

});