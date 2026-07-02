sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library",
    "sap/m/MessageToast",
  ],
  function (Controller, UIComponent, mobileLibrary, MessageToast) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return Controller.extend("zxpapap0001a.controller.BaseController", {
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
        var oViewModel =
          this.getModel("objectView") || this.getModel("worklistView");
        URLHelper.triggerEmail(
          null,
          oViewModel.getProperty("/shareSendEmailSubject"),
          oViewModel.getProperty("/shareSendEmailMessage"),
        );
      },

      onTopdeskGenericIncident: function (oEvent) {
        // Incident type 01
        this.genericDialog =
          this.createTopdeskDialog("topdeskGeneric", "01");
        this.genericDialog.open();
      },

      onNavToTopDesk: function (evt) {
        const sUrl =
          "https://boels.topdesk.net/tas/public/ssp/content/serviceflow?unid=0d605fc75d7d447a88e13f714396adb3&openedFromService=true";
        URLHelper.redirect(sUrl, true);
      },

      onNoDeliveryFound: function () {
        // TODO: Determine incident type
        this.noDeliveryFoundDialog =
          this.createTopdeskDialog("noDeliveryFound", "10");
        this.noDeliveryFoundDialog.open();
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
          cols: 40,
          required: true
        });
        const defaultDepot = localStorage.getItem("defaultDepot");

        if (defaultDepot) {
          depot.setValue(defaultDepot);
          depot.setEnabled(false);
        }


        const depot_prefilled = new sap.m.Input(null, { enabled: false });
        depot_prefilled.setEnabled(false);
        if (context) depot_prefilled.setValue(context.getProperty("Depot"));

        const supplier_prefilled = new sap.m.Input({
          cols: 40,
          required: true
        });
        supplier_prefilled.setEnabled(false);
        if (context)
          supplier_prefilled.setValue(
            `${context.getProperty("Supplier")} - ${context.getProperty("SupplierName")}`,
          );

        const delivery_reference_prefilled = new sap.m.Input({
          cols: 40,
          required: true
        });
        delivery_reference_prefilled.setEnabled(false);
        if (context)
          delivery_reference_prefilled.setValue(
            context.getProperty("DeliveryDocument"),
          );

        const material_prefilled = new sap.m.Input({
          cols: 40,
          required: true
        });
        material_prefilled.setEnabled(false);
        if (context)
          material_prefilled.setValue(
            `${context.getProperty("MaterialNumber")} - ${context.getProperty("MaterialDescription")}`,
          );

        const delivered_material = new sap.m.Input({
          cols: 40,
          required: true
        });
        // todo: make required

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

        // const quantity_received = new sap.m.Input();
        // if(context) quantity_received.setValue();

        // Create lookup object per incident type

        const lookup = {
          "01": [
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblDepot"),
              control: depot,
            },
            // {
            //   label: this.getModel("i18n").getResourceBundle().getText("lblSupplier"),
            //   control: new sap.m.Input({
            //     cols: 40,
            //     required: true
            //   }),
            // },
            // {
            //   label: this.getModel("i18n").getResourceBundle().getText("lblDeliveryReference"),
            //   control: new sap.m.Input({
            //     cols: 40,
            //     required: true
            //   }),
            // },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblRemarks01"),
              control: new sap.m.TextArea({
                cols: 40,
                required: true
              }),
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblAttachments01"),
              control: attachment
            }
          ],
          "02": [
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblDepot"),
              control: depot_prefilled,
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblSupplier"),
              control: supplier_prefilled,
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblDeliveryReference"),
              control: delivery_reference_prefilled,
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblMaterial"),
              control: material_prefilled,
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblRemarks02"),
              control: new sap.m.TextArea({
                cols: 40,
                // required: true
              }),
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblAttachments02"),
              control: attachment
            }
          ],
          "03": [
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblDepot"),
              control: depot_prefilled,
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblSupplier"),
              control: supplier_prefilled,
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblDeliveryReference"),
              control: delivery_reference_prefilled,
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblMaterial"),
              control: material_prefilled,
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblDeliveredMaterial"),
              control: delivered_material
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblRemarks03"),
              control: new sap.m.TextArea({
                cols: 40,
                // required: true
              }),
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblAttachments03"),
              control: attachment
            }
          ],
          "04": [
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblDepot"),
              control: depot_prefilled,
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblSupplier"),
              control: supplier_prefilled,
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblDeliveryReference"),
              control: delivery_reference_prefilled,
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblQTYOnDeliveryNote"),
              control: new sap.m.Input({
                cols: 40,
                required: true
              }),
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblQTYReceived"),
              control: new sap.m.Input({
                cols: 40,
                required: true
              }),
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblRemarks04"),
              control: new sap.m.TextArea({
                cols: 40,
                required: false
              }),
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblAttachments04"),
              control: attachment
            }
          ],
          "10": [
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblDepot"),
              control: depot,
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblSupplier"),
              control: new sap.m.Input({
                cols: 40,
                required: true
              }),
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblDeliveryReference"),
              control: new sap.m.Input({
                cols: 40,
                required: true
              }),
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblRemarks10"),
              control: new sap.m.TextArea({
                cols: 40,
                required: true
              }),
            },
            {
              label: this.getModel("i18n").getResourceBundle().getText("lblAttachments10"),
              control: attachment,
              required: true
            }
          ],
        };

        const items = [];

        for (const value of lookup[incidentType]) {
          items.push(new sap.m.Label({ text: `${value.label}:`, required: value.required ?? (value.control.getRequired ? value.control.getRequired() : false) }));
          items.push(value.control);
        }

        // if (incidentType == "01") {
        //   items.push(
        //     new sap.m.VBox({
        //       items: [
        //         new sap.m.Label({ text: this.getModel("i18n").getResourceBundle().getText("lblAttachments") + ":", required: false }),
        //         attachment,
        //       ]
        //     })
        //   );
        // } else {
        //   items.push(
        //     new sap.m.VBox({
        //       items: [
        //         new sap.m.Label({ text: this.getModel("i18n").getResourceBundle().getText("lblAttachments") + ":", required: true }),
        //         attachment,
        //       ]
        //     })
        //   );
        // }


        var oDialog = new sap.m.Dialog({
          id,
          title: "TOPdesk",
          state: "Information",
          content: [
            new sap.m.VBox({
              items,
            }).addStyleClass("sapUiMediumMargin"),
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

              const longText = that.formatNotificationLongText(
                lookup[incidentType].map((item) => {
                  return {
                    name: item.label,
                    value: item.control.getValue(),
                  };
                }),
              );

              const oUserInfo = sap.ushell.Container.getService("UserInfo");
              const sFirstName = oUserInfo.getUser().getFirstName();
              const sLastName = oUserInfo.getUser().getLastName();
              const name = formatName(sFirstName, sLastName);

              const source = sEvent.getSource();
              source.setBusy(true);

              that.createNotification({
                incidentType,
                depot:
                  incidentType == "01" || incidentType == "10"
                    ? depot.getValue()
                    : depot_prefilled.getValue(),
                delivery: context
                  ? context.getProperty("DeliveryDocument")
                  : "",
                posnr: context
                  ? context.getProperty("DeliveryPosition")
                  : "",
                longText: longText,
                // Add delivery reference and posnr
                email:
                  sap.ushell.Container.getService("UserInfo")?.getEmail() ||
                  "john.doe@aiden.eu",
                attachment: attachment.content,
                name,
                success: function (oData, response) {

                  sap.ui.getCore().byId(id).close();

                  source.setBusy(false);

                  MessageToast.show(`${that.getModel("i18n").getResourceBundle().getText("msgIncidentCreatedSuccesfully")}: ${oData.TicketNumber}`);

                  if (onCreated) onCreated();
                }.bind(this),
                error: function (err) {
                  source.setBusy(false);
                  console.log(err)
                }
              });
            },
          }),
          endButton: new sap.m.Button({
            text: this.getResourceBundle().getText("lblClose"),
            press: function () {
              sap.ui.getCore().byId(id).close();

              if (onCancel) onCancel();
            },
          }),
        });
        return oDialog;
      },

      createNotification: function ({
        incidentType = "01",
        email,
        depot,
        longText,
        delivery = "",
        posnr = "",
        attachment = "",
        name = "",
        success = () => { },
        error = () => { },
      } = {}) {
        const payload = {
          IncidentType: encodeURIComponent(incidentType),
          Delivery: encodeURIComponent(delivery),
          DeliveryPosnr: encodeURIComponent(posnr),
          FileContent: encodeURIComponent(attachment),
          Equipment: encodeURIComponent(""),
          SerialNumber: encodeURIComponent(""),
          Depot: encodeURIComponent(depot),
          LongText: encodeURIComponent(longText),
          Email: encodeURIComponent(email),
          Name: encodeURIComponent(name)
        };

        const that = this;

        this.getModel().setUseBatch(true);
        this.getModel().callFunction("/CreateRejectionNotif", {
          method: "POST",
          urlParameters: payload,
          success: function (oData, response) {
            that.getModel().setUseBatch(false);
            success(oData, response);
          },
          error,
        });
        // this.getModel().setUseBatch(false);

        // this.getModel().callFunction("/CreateRejectionNotif", 
        //    "POST",
        //   payload,
        //   null,
        //   success,
        //   error,
        // );

        //oModel.callFunction('GetProductsByRating', 'GET', {rating : 3 }, null, fnSuccess, fnError)  ;  
      },

      // Enter an array with objects looking like: { name, value }
      formatNotificationLongText: function (items) {
        return items
          .map(({ name, value }) => {
            return `<strong>${name}</strong>: ${value}`;
          })
          .join("<br/>")
      },
    });
  },
);
