sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "../model/formatter",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterType",
    "sap/m/MessageToast",
    "sap/m/SearchField",
    "sap/ui/model/type/String",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/GroupHeaderListItem",
    "sap/m/ColumnListItem",
    "sap/ui/table/Column",
    "sap/m/Column",
    "sap/m/Label",
    "sap/m/Text",
    "sap/ui/model/Sorter",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/MessageBox",
  ],
  function (
    BaseController,
    JSONModel,
    Device,
    formatter,
    Fragment,
    FilterType,
    MessageToast,
    SearchField,
    TypeString,
    Filter,
    FilterOperator,
    GroupHeaderListItem,
    ColumnListItem,
    UIColumn,
    MColumn,
    Label,
    Text,
    Sorter,
    Dialog,
    Button,
    MessageBox,
  ) {
    "use strict";

    return BaseController.extend("zxpapap0001a.controller.Worklist", {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the worklist controller is instantiated.
       * @public
       */
      onInit: function () {
        console.log("init");
        this._depotInitialized = false;
        const controller = this;
        const depotSelection = this.byId("depotSelection");
        this._oView = this.getView();
        const oDataModel = this.getOwnerComponent().getModel();
        // keeps the search state
        // this._aTableSearchState = [];

        // Model used to manipulate control states
        const oViewModel = new JSONModel({
          worklistTableTitle:
            this.getResourceBundle().getText("lblDeliveries"),
          shareSendEmailSubject: this.getResourceBundle().getText(
            "shareSendEmailWorklistSubject",
          ),
          shareSendEmailMessage: this.getResourceBundle().getText(
            "shareSendEmailWorklistMessage",
            [location.href],
          ),
          tableNoDataText: this.getResourceBundle().getText("lblNoOpenDeliveries"),
        });
        this.setModel(oViewModel, "worklistView");

        this._oSupplierFilter = this.byId("supplierFilter");
        this._oSubGroupFilter = this.byId("subgroupFilter");
        this._oDepotFilter = this.byId("depotFilter");

        this.getRouter()
          .getRoute("worklist")
          .attachPatternMatched(this._onObjectMatched, this);

        sap.ui.require(["sap/ushell/Container"], async (Container) => {
          const oUserInfoService = await Container.getServiceAsync("UserInfo");
          this.oUserInfoService = oUserInfoService;
        });

        // this.setupListeners();
      },

      _onObjectMatched: function () {
        console.log("on object matched");
        this.initializeDepot();
      },

      //sleep: function(ms) {
      //    return new Promise(resolve => setTimeout(resolve, ms));
      //},
      onBeforeShow: function () {
        console.log("on before show");
      },

      onAfterRendering: function () {
        console.log("on after rendering");

        try {
          const binding = this.byId("table").getBinding("items");
          binding.suspend();
          console.log("suspended");
        } catch (err) {
          console.log(err);
        }

        // this.byId("historyDatePicker").setValue(new Date());
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /**
       * Triggered by the table's 'updateFinished' event: after new table
       * data is available, this handler method updates the table counter.
       * This should only happen if the update was successful, which is
       * why this handler is attached to 'updateFinished' and not to the
       * table's list binding's 'dataReceived' method.
       * @param {sap.ui.base.Event} oEvent the update finished event
       * @public
       */
      onUpdateFinished: function (oEvent) {
        // update the worklist's object counter after the table update
        var sTitle,
          oTable = oEvent.getSource(),
          iTotalItems = oEvent.getParameter("total");
        // only update the counter if the length is final and
        // the table is not empty
        if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
          sTitle = this.getResourceBundle().getText("lblDeliveriesCount", [
            iTotalItems,
          ]);
        } else {
          sTitle = this.getResourceBundle().getText("lblDeliveries");
        }
        this.getModel("worklistView").setProperty(
          "/worklistTableTitle",
          sTitle,
        );
      },

      /**
       * Event handler when a table item gets pressed
       * @param {sap.ui.base.Event} oEvent the table selectionChange event
       * @public
       */
      onPress: function (oEvent) {
        // create dialog lazily
        var oView = this.getView();
        var oBindingContext = oEvent.getSource().getBindingContext();
        if (!this._oDialog) {
          this._oDialog = sap.ui.xmlfragment(
            "zxpapap0001a.view.PopupDialog",
            this,
          );
          oView.addDependent(this._oDialog);
        }
        this._oDialog.setBindingContext(oBindingContext);
        this._oDialog.open();
      },

      onStornoChange: function (sEvent) {
        const value = sEvent.getSource().getValue();
        sEvent.getSource().getBindingContext().setProperty("Quantity", value);
      },

      onStorno: function (sEvent) {
        const context = sEvent.getSource().getBindingContext();
        const quantity = context.getProperty("Quantity");

        if (!quantity) {
          return;
        }

        const max_quantity = context.getProperty("Storno_QTY");

        if (parseFloat(quantity) > parseFloat(max_quantity)) {
          MessageToast.show(this.getView()
            .getModel("i18n")
            .getResourceBundle()
            .getText("msgStornoQuantityExceeds"));
          return;
        }

        const oUserInfo = sap.ushell.Container.getService("UserInfo");
        const sFirstName = oUserInfo.getUser().getFirstName();
        const sLastName = oUserInfo.getUser().getLastName();

        const entry = {
          DeliveryDocument: context.getProperty("DeliveryDocument"),
          DeliveryPosition: context.getProperty("DeliveryPosition"),
          Cancel: 'X',
          ReceivedQuantity: quantity,
          bktxt: formatName(sFirstName, sLastName)
        };

        const that = this;

        const oModel = this.getView().getModel();
        oModel.setUseBatch(false);
        oModel.create("/ZXPAP0001_Delivery", entry, {
          success: function () {
            MessageToast.show(that.getView()
              .getModel("i18n")
              .getResourceBundle()
              .getText("msgStornoSuccess"));

            oModel.refresh();
            const input = sEvent.getSource().getParent().getItems()[0];
            input.setValue(null)
            that.byId("historyDialog").close();
            location.reload();
          },
          error: function (err) {
            MessageToast.show("Error storing record");
          }
        });
      },

      onPress2: function (oEvent) {
        // The source is the list item that got pressed
        this._showObject(oEvent.getSource());
      },

      getDepotFilters: function () {
        let sDepot = this._oDepotFilter.getSelectedKey() || localStorage.getItem("defaultDepot");

        // if (sDepot === '') {
        //     sDepot = this._oDepotFilter.getValue();
        // }
        if (sDepot.length !== 0) {
          let oDepotFilter = new Filter({
            path: "Depot",
            operator: "EQ",
            value1: sDepot,
          });
          return oDepotFilter;
        }
      },

      setDepotFilter: function (sDepot) {
        //;
        //sessionStorage.setItem("default_depot", sDepot);
        let sEmail = this.getOwnerComponent().oUserInfoService.getEmail();

        // if (!sEmail) { // TODO: remove before when deploying
        //     sEmail = 'john.doe@aiden.eu';
        // }

        const sPath = "Depot";
        const sOperator = "EQ";
        const oBinding = this.byId("table").getBinding("items");
        // oBinding.filter([new sap.ui.model.Filter(sPath, sOperator, sDepot),
        // // new sap.ui.model.Filter("Email", FilterOperator.EQ, sEmail.toUpperCase())
        // ]);

        //  Update the title depot
        const titleText = this.getView()
          .getModel("i18n")
          .getResourceBundle()
          .getText("lblGoodsReceipt");
        this.byId("headingTitle").setText(`${titleText} - ${sDepot}`);
      },

      onDepotSuggested: function (oEvent) {
        if (oEvent.getSource().getValue()) {
          this.onSearch();
        }
      },

      // onDepotSuggest: function (oEvent) {
      //     console.log("on depot suggest")
      //     const sTerm = `${oEvent.getParameter("suggestValue")}`;
      //     let aFilters = [];
      //     if (sTerm) {
      //         aFilters.push(new Filter("Depot", FilterOperator.Contains, sTerm));
      //         aFilters.push(new Filter("DepotName", FilterOperator.Contains, sTerm));
      //         aFilters.push(new Filter("ShopNr", FilterOperator.Contains, sTerm));
      //         aFilters.push(new Filter("City", FilterOperator.Contains, sTerm));
      //         //aFilters.push(new Filter("Search", FilterOperator.Contains, sTerm));
      //     }

      //     let sEmail = this.getOwnerComponent().oUserInfoService.getEmail();

      //     const oFilter = new Filter({
      //         filters: [new Filter({
      //             filters: aFilters,
      //             and: false
      //         }),
      //         new Filter("Email", FilterOperator.Contains, sEmail)
      //         ],
      //         and: true
      //     })

      //     this._oDepotFilter.setFilterFunction((sTerm, oItem) => {
      //         return oItem.getText().match(new RegExp(sTerm, "i"));
      //     });

      //     oEvent.getSource().getBinding("suggestionItems").filter(oFilter);
      // },

      onSubgroupSuggest: function (oEvent) {
        const sTerm = oEvent.getParameter("suggestValue");

        let aFilters = [
          // new Filter("Email", FilterOperator.EQ, sEmail)
        ];
        if (sTerm) {
          aFilters.push(new Filter("SubGroup", FilterOperator.Contains, sTerm));
        }

        const oFilter = new Filter({
          filters: aFilters,
          and: false,
        });

        oEvent.getSource().getBinding("suggestionItems").filter(oFilter);
      },

      onDepotsRequested: function (oEvent) {
        // this._oDepotFilter.setBusy(true);
      },

      onDepotsReceived: function (oEvent) {
        // this._oDepotFilter.setBusy(false);
      },

      onOpenVHSupplier: function () {
        this._oBasicSearchField = new SearchField();
        this.loadFragment({
          name: "zxpapap0001a.fragments.SupplierValueHelp",
        }).then(
          function (oDialog) {
            var oFilterBar = oDialog.getFilterBar(),
              oColumnSupplierID,
              oColumnSupplierName;
            this._oVHSupplierDialog = oDialog;

            this.getView().addDependent(oDialog);

            // Set key fields for filtering in the Define Conditions Tab
            oDialog.setRangeKeyFields([
              {
                label: "Supplier",
                key: "Supplier",
                type: "string",
                typeInstance: new TypeString(
                  {},
                  {
                    maxLength: 7,
                  },
                ),
              },
            ]);

            // Set Basic Search for FilterBar
            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(this._oBasicSearchField);

            // Trigger filter bar search when the basic search is fired
            this._oBasicSearchField.attachSearch(function () {
              oFilterBar.search();
            });

            oDialog.getTableAsync().then(
              function (oTable) {
                // oTable.setModel(this.oProductsModel);

                // For Desktop and tabled the default table is sap.ui.table.Table
                if (oTable.bindRows) {
                  // Bind rows to the ODataModel and add columns
                  oTable.bindAggregation("rows", {
                    path: "/I_Supplier_VH",
                    events: {
                      dataReceived: function () {
                        oDialog.update();
                      },
                    },
                  });
                  oColumnSupplierID = new UIColumn({
                    label: new Label({ text: "{i18n>vhSupplierLabelId}" }),
                    template: new Text({ wrapping: false, text: "{Supplier}" }),
                  });
                  oColumnSupplierID.data({
                    fieldName: "Supplier",
                  });
                  oColumnSupplierName = new UIColumn({
                    label: new Label({ text: "{i18n>vhSupplierLabelName}" }),
                    template: new Text({
                      wrapping: false,
                      text: "{SupplierName}",
                    }),
                  });
                  oColumnSupplierName.data({
                    fieldName: "SupplierName",
                  });
                  oTable.addColumn(oColumnSupplierID);
                  oTable.addColumn(oColumnSupplierName);
                }

                // For Mobile the default table is sap.m.Table
                if (oTable.bindItems) {
                  // Bind items to the ODataModel and add columns
                  oTable.bindAggregation("items", {
                    path: "/I_Supplier_VH",
                    template: new ColumnListItem({
                      cells: [
                        new Label({ text: "{Supplier}" }),
                        new Label({ text: "{SupplierName}" }),
                      ],
                    }),
                    events: {
                      dataReceived: function () {
                        oDialog.update();
                      },
                    },
                  });
                  oTable.addColumn(
                    new MColumn({ header: new Label({ text: "Supplier" }) }),
                  );
                  oTable.addColumn(
                    new MColumn({
                      header: new Label({ text: "Supplier Name" }),
                    }),
                  );
                }
                oDialog.update();
              }.bind(this),
            );

            oDialog.setTokens(this._oSupplierFilter.getTokens());
            oDialog.open();
          }.bind(this),
        );
      },

      onVHSupplierSearch: function (oEvent) {
        var sSearchQuery = this._oBasicSearchField.getValue(),
          aSelectionSet = oEvent.getParameter("selectionSet");

        var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
          if (oControl.getValue()) {
            aResult.push(
              new Filter({
                path: oControl.getName(),
                operator: FilterOperator.Contains,
                value1: oControl.getValue(),
              }),
            );
          }

          return aResult;
        }, []);

        aFilters.push(
          new Filter({
            filters: [
              new Filter({
                path: "Supplier",
                operator: FilterOperator.Contains,
                value1: sSearchQuery,
              }),
              new Filter({
                path: "SupplierName",
                operator: FilterOperator.Contains,
                value1: sSearchQuery,
              }),
            ],
            and: false,
          }),
        );

        this._filterVHSupplierTable(
          new Filter({
            filters: aFilters,
            and: true,
          }),
        );
      },

      onVHSupplierOk: function (oEvent) {
        var aTokens = oEvent.getParameter("tokens");
        this._oSupplierFilter.setTokens(aTokens);
        this._oVHSupplierDialog.close();
      },

      onVHSupplierCancel: function () {
        this._oVHSupplierDialog.close();
      },

      onVHSupplierAfterClose: function () {
        this._oVHSupplierDialog.destroy();
      },

      // _filterVHSupplierTable: function (oFilter) {
      //     var oVHSupplierDialog = this._oVHSupplierDialog;

      //     oVHSupplierDialog.getTableAsync().then(function (oTable) {
      //         if (oTable.bindRows) {
      //             oTable.getBinding("rows").filter(oFilter);
      //         }
      //         if (oTable.bindItems) {
      //             oTable.getBinding("items").filter(oFilter);
      //         }

      //         // This method must be called after binding update of the table.
      //         oVHSupplierDialog.update();
      //     });
      // },

      getSupplierFilters: function () {
        const sQuery = this.byId("supplierFilter").getValue();

        if (sQuery) {
          const filter = new Filter(
            "SupplierName",
            FilterOperator.Contains,
            sQuery,
          );

          return filter;
        }
        // let oSupplierFilter = this._oSupplierFilter;

        // let aSelectedKeys = [];
        // oSupplierFilter.getTokens().forEach(function (oToken) {
        //     aSelectedKeys.push(oToken.getKey());
        // })

        // let aFilters = aSelectedKeys.map(function (sSelectedKey) {
        //     return new Filter({ path: "Supplier", operator: FilterOperator.Contains, value1: sSelectedKey });
        // });

        // if (aSelectedKeys.length > 0) {
        //     let oResultFilter = new Filter({
        //         filters: aFilters,
        //         and: false
        //     });
        //     return oResultFilter;
        // }
      },

      onConfirmDialog: function () {
        var oEntry = {};
        var that = this;
        var sPath = this._oDialog.getBindingContext().sPath;

        oEntry.DeliveryDocument = sap.ui.getCore().byId("_val0").getValue();
        oEntry.DeliveryPosition = sap.ui.getCore().byId("_val6").getValue();
        oEntry.ReceivedQuantity = sap.ui.getCore().byId("_val3").getValue();
        oEntry.DeliveryNotePresent = sap.ui.getCore().byId("_val4").getValue();
        oEntry.Damage = sap.ui.getCore().byId("damage").getSelected();
        oEntry.DamageRemark = sap.ui.getCore().byId("_val5").getValue();

        const oUserInfo = sap.ushell.Container.getService("UserInfo");
        const sFirstName = oUserInfo.getUser().getFirstName();
        const sLastName = oUserInfo.getUser().getLastName();

        oEntry.bktxt = formatName(sFirstName, sLastName);

        var oModel = this.getView().getModel();
        oModel.setUseBatch(false);
        oModel.create("/ZOPEN_DELIVERY_OVERVIEW_GR", oEntry, {
          success: function () {
            that._oDialog.close();
            MessageToast.show("Record succesfully stored");
          },
          error: function () {
            MessageToast.show("Error storing record");
          },
        });
        sap.ui.getCore().byId("damage").setSelected();
        sap.ui.getCore().byId("_val5").setValue();
      },

      onCloseDialog: function () {
        this._oDialog.close();
        sap.ui.getCore().byId("damage").setSelected();
        sap.ui.getCore().byId("_val5").setValue();
      },

      /**
       * Event handler for navigating back.
       * Navigate back in the browser history
       * @public
       */
      onNavBack: function () {
        // eslint-disable-next-line fiori-custom/sap-no-history-manipulation, fiori-custom/sap-browser-api-warning
        history.go(-1);
        this.onSearch();
      },

      onDepotAccessPress: function () {
        const that = this;
        const sEmail = (this.getOwnerComponent().sUserEmail || "").toUpperCase();
        const oDataModel = this.getOwnerComponent().getModel();

        oDataModel.callFunction("/GetUserSystem", {
          method: "GET",
          urlParameters: { Email: sEmail },
          success: function (oData) {
            if (oData.Type === "URL") {
              window.open(oData.Value, "_blank");
            } else if (oData.Type === "MSG") {
              MessageBox.information(that.getResourceBundle().getText(oData.Value));
            }
          },
          error: function (oError) {
            console.log("GetUserSystem error:", oError);
          },
        });
      },

      initializeDepot: function () {
        const that = this;
        const oDataModel = this.getOwnerComponent().getModel();

        const sEmail = (this.getOwnerComponent().sUserEmail || 'john.doe@aiden.eu').toUpperCase();

        console.log(`Initializing depot for: ${sEmail}`);

        oDataModel.setUseBatch(false);
        // Force a fresh backend request — bypass browser HTTP cache
        oDataModel.setHeaders({ "Cache-Control": "no-cache, no-store" });
        oDataModel.callFunction("/GetUserDepots", {
          method: "GET",
          urlParameters: {
            Username: sEmail,
          },
          success: function (oData, response) {
            console.log("User depots loaded:", oData.results ? oData.results.length : 0, "depots");

            const oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(oData);
            that._oDepotFilter.setModel(oModel, "depots");

            // Initialize keys with "---" if they don't exist (new user or cleared storage)
            if (localStorage.getItem("defaultDepot") === null) {
              localStorage.setItem("defaultDepot", "---");
            }
            if (localStorage.getItem("defaultDepotValue") === null) {
              localStorage.setItem("defaultDepotValue", "---");
            }

            let defaultDepot = localStorage.getItem("defaultDepot");
            const defaultDepotValue = localStorage.getItem("defaultDepotValue");

            // Recovery: defaultDepotValue present but defaultDepot removed (inconsistent state)
            if (!defaultDepot && defaultDepotValue) {
              const extractedKunnr = defaultDepotValue.split(" / ")[0];
              if (oData.results.some((item) => item.Kunnr === extractedKunnr)) {
                defaultDepot = extractedKunnr;
                localStorage.setItem("defaultDepot", defaultDepot);
                console.log("recovered defaultDepot from defaultDepotValue:", defaultDepot);
              }
            }

            // If the stored depot is no longer in the user's accessible depot list, reset it
            if (defaultDepot && defaultDepot !== "---" && !oData.results.some((item) => item.Kunnr === defaultDepot)) {
              console.log("defaultDepot no longer accessible, resetting:", defaultDepot);
              localStorage.setItem("defaultDepot", "---");
              localStorage.setItem("defaultDepotValue", "---");
              defaultDepot = "---";
            }

            that._depotInitialized = true;

            if (defaultDepot && defaultDepot !== "---") {
              that._oDepotFilter.setSelectedKey(defaultDepot);
              console.log("set selected depot from local storage");
              that._oDepotFilter.setValue(defaultDepotValue);
              that.onSearch();
            } else {
              // No valid depot — clear the depot field and wipe any cached table data
              that._oDepotFilter.setValue("");
              that._oDepotFilter.setSelectedKey("");
              const oTableBinding = that.byId("table").getBinding("items");
              if (oTableBinding) {
                // Apply an impossible filter, then resume to flush old cached results
                oTableBinding.filter(new Filter("Depot", FilterOperator.EQ, "---"));
                oTableBinding.resume();
              }
            }
          },
          error: function (oError) {
            console.log(oError);
            // On error, apply impossible filter so no deliveries are shown unfiltered
            const oTableBinding = that.byId("table").getBinding("items");
            if (oTableBinding) {
              oTableBinding.filter(new Filter("Depot", FilterOperator.EQ, "---"));
              oTableBinding.resume();
            }
          },
        });
      },

      resetTimer: function () {
        console.log("reset the timer");

        const duration = 5 * 1000;

        if (this.timeout) clearTimeout(this.timeout);

        const that = this;

        that.timeout = setTimeout(this.refreshList.bind(this), duration);
      },

      refreshList: function () {
        console.log("refresh the list")
        const duration = 5 * 1000;
        const that = this;

        that.timeout = setTimeout(this.refreshList.bind(this), duration);
      },

      setupListeners: function () {
        window.onmousemove = this.resetTimer;
        window.onload = this.resetTimer;
        window.onmousemove = this.resetTimer;
        // window.onkeypress = this.resetTimer;
        window.onclick = this.resetTimer;
        window.onscroll = this.resetTimer;

        this.timeout = setTimeout(this.refreshList.bind(this), 5 * 1000);
      },

      onDepotChange: function (oEvent) {
        this.onSearch();
      },

      onLiveChangeDepot: function () {
        const value = this._oDepotFilter.getValue();

        const filters = [
          new Filter("DepotName", "Contains", value),
          new Filter("City", "Contains", value),
          new Filter("Address", "Contains", value),
          new Filter("Kunnr", "Contains", value),
          new Filter("InsphireCode", "Contains", value),
        ];

        const oBinding = this._oDepotFilter.getBinding("suggestionItems");
        if (oBinding) {
          oBinding.filter(new Filter(filters));
        }
      },

      onSearch: function (event) {
        var aAllFilters = [];

        const inputValue = this._oDepotFilter.getValue();
        const selectedKey = inputValue ? this._oDepotFilter.getSelectedKey() : "";
        const depot = selectedKey || (inputValue ? localStorage.getItem("defaultDepot") : null);

        if (!depot) {
          if (!inputValue && this._depotInitialized) {
            // User deliberately cleared the field — reset localStorage
            localStorage.setItem("defaultDepot", "---");
            localStorage.setItem("defaultDepotValue", "---");
          }
          console.log("return on search, depot empty");
          return;
        }

        const depotsModel = this._oDepotFilter.getModel("depots");
        if (!depotsModel) {
          console.log("return on search, depots model not loaded yet");
          return;
        }

        if (
          !depotsModel
            .getData()
            .results.some((item) => item.Kunnr == depot)
        ) {
          console.log("depot not found in user list", depot);
          localStorage.setItem("defaultDepot", "---");
          localStorage.setItem("defaultDepotValue", "---");
          this._oDepotFilter.setValue(null);
          return;
        }

        console.log(`searching for: ${depot}`);

        localStorage.setItem("defaultDepot", depot);
        localStorage.setItem("defaultDepotValue", this._oDepotFilter.getValue());

        this._oSubGroupFilter
          .getBinding("items")
          .filter(new Filter("Depot", "EQ", depot));
        this._oSupplierFilter
          .getBinding("items")
          .filter(new Filter("Depot", "EQ", depot));

        if (this.getSearchFilters()) {
          aAllFilters.push(this.getSearchFilters());
        }
        if (this.getDepotFilters()) {
          aAllFilters.push(this.getDepotFilters());
        }

        if (this.getSupplierFilters()) {
          aAllFilters.push(this.getSupplierFilters());
        }

        if (this.getSubgroupFilters()) {
          aAllFilters.push(this.getSubgroupFilters());
        }

        if (aAllFilters.length === 0) {
          console.log("return on search, no filters built");
          return;
        }

        var oTotalFilter = new Filter({
          filters: aAllFilters,
          and: true,
        });
        const binding = this.byId("table").getBinding("items");
        binding.filter(oTotalFilter);
        this.setViewTitle();
      },

      setViewTitle: function () {
        // sDepot = this._oDepotFilter.getSelectedKey();
        // let sDepot = this._oDepotFilter.getValue();
        const sDepot = localStorage.getItem("defaultDepotValue");
        // if (sDepot === "") {
        // }
        //sessionStorage.setItem("default_depot", sDepot);
        //  Update the title depot
        const titleText = this.getView()
          .getModel("i18n")
          .getResourceBundle()
          .getText("lblGoodsReceipt");
        this.byId("headingTitle").setText(`${titleText} - ${sDepot}`);
      },

      getSubgroupFilters() {
        const sQuery = this.byId("subgroupFilter").getValue();

        if (sQuery) {
          const filter = new Filter(
            "SubGroup",
            FilterOperator.Contains,
            sQuery,
          );

          return filter;
        }
      },

      getSearchFilters: function () {
        let sQuery = this.byId("searchField").getValue();
        // oTableSearchState;

        if (sQuery && sQuery.length > 0) {
          let oTableSearchState = new Filter({
            filters: [
              new Filter("DeliveryDocument", FilterOperator.Contains, sQuery),
              //new Filter("SupplierName", FilterOperator.Contains, sQuery),
              new Filter(
                "MaterialDescription",
                FilterOperator.Contains,
                sQuery,
              ),
              new Filter("MaterialNumber", FilterOperator.Contains, sQuery),
              new Filter("PurchaseOrder", FilterOperator.Contains, sQuery),
              new Filter(
                "SupplierSerialnumber",
                FilterOperator.Contains,
                sQuery,
              ),
            ],
            and: false,
          });
          return oTableSearchState;
        }
      },

      /**
       * Event handler for refresh event. Keeps filter, sort
       * and group settings and refreshes the list binding.
       * @public
       */
      onRefresh: function () {
        var oTable = this.byId("table");
        oTable.getBinding("items").refresh();
      },
      onClearFB: function (oEvent) {
        this._oSubGroupFilter.setSelectedItem(null);
        this._oSupplierFilter.setSelectedItem(null);
        this.onSearch();
      },

      /* =========================================================== */
      /* internal methods                                            */
      /* =========================================================== */

      /**
       * Shows the selected item on the object page
       * @param {sap.m.ObjectListItem} oItem selected Item
       * @private
       */
      _showObject: function (oItem) {
        this.getRouter().navTo("object", {
          // objectId: oItem.getBindingContext().getPath().substring("/ZOPEN_DELIVERY_OVERVIEW_GR".length)
          objectId: oItem
            .getBindingContext()
            .getPath()
            .substring("/ZOPEN_DELIVERY_OVERVIEW_GR".length),
        });
      },

      /**
       * Internal helper method to apply both filter and search state together on the list binding
       * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
       * @private
       */
      // _applySearch: function (aTableSearchState) {
      //     ;
      //     var oTable = this.byId("table"),
      //         oViewModel = this.getModel("worklistView");
      //     oTable.getBinding("items").filter(aTableSearchState, "Application");
      //     // changes the noDataText of the list in case there are no filter results
      //     if (aTableSearchState.length !== 0) {
      //         oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
      //     }
      // },

      getGroup: function (oContext) {
        return `${oContext.getProperty("DeliveryDocument")}  - ${oContext.getProperty("SupplierName")}`;
      },

      getGroupHeader: function (oGroup) {
        // let sTitle = "";

        // if (Device.system.phone) {
        //     sTitle = this.getResourceBundle().getText("columnTitleDelivery") + " " + oGroup.key;
        // } else {
        //     sTitle = oGroup.key;
        // }

        return new GroupHeaderListItem({ title: `${oGroup.key}` });
      },

      createExceptionNotification() {
        const dialog = this.byId("exceptionNotificationDialog");
        const isOpen = dialog.isOpen();

        isOpen ? dialog.close() : dialog.open();

        // if (isOpen) {
        //     dialog.close();
        // } else {
        //     const warningDialog = new Dialog({
        //         type: "Message",
        //         title: "Confirm",
        //         content: new Text({
        //             // text: this.getResourceBundle().getText("notifConfirmDialogText")
        //             text: "Are you sure you want to create an exception notification?"
        //         }),
        //         beginButton: new Button({
        //             type: "Emphasized",
        //             text: this.getResourceBundle().getText("notifConfirmContinueText"),
        //             press: function () {
        //                 warningDialog.close();
        //                 dialog.open();
        //             }.bind(this)
        //         }),
        //         endButton: new Button({
        //             text: this.getResourceBundle().getText("notifConfirmCancelText"),
        //             press: function () {
        //                 warningDialog.close();
        //             }.bind(this)
        //         })
        //     });
        //     warningDialog.open();
        // }
      },

      onDeliveryHistoryPress() {
        this.onHistorySearch();
        const dialog = this.byId("historyDialog");
        dialog.open();
      },

      onHistorySearch() {
        console.log("onHistorySearch")
        const search = this.byId("historySearch").getValue();
        const days = this.byId("historyDatePicker").getValue();
        const depot = this._oDepotFilter.getSelectedKey() || localStorage.getItem("defaultDepot");

        if (!depot) {
          return;
        };

        const filters = [];

        if (search) {
          filters.push(new Filter("Supplier", FilterOperator.Contains, search));
          filters.push(new Filter("SupplierName", FilterOperator.Contains, search));
          filters.push(new Filter("DeliveryDocument", FilterOperator.Contains, search));
          filters.push(new Filter("Material", FilterOperator.Contains, search));
          filters.push(new Filter("MaterialDescription", FilterOperator.Contains, search));
          filters.push(new Filter("Subgroup", FilterOperator.Contains, search));
          filters.push(new Filter("SupplierBatch", FilterOperator.Contains, search));
          filters.push(new Filter("PostedBy", FilterOperator.Contains, search));
        }

        // if (days) {
        //   // filters.push(new Filter("PostingDate", FilterOperator.EQ, date));
        //   filters.push(this.createRecentDateFilter("PostingDate", days));
        // }


        const orFilter = new Filter({
          filters,
          and: false
        });

        const depotFilter = new Filter("Depot", FilterOperator.EQ, depot);

        const andFilter = new Filter({
          filters: days ? [
            depotFilter,
            this.createRecentDateFilter("PostingDate", days)
          ] : [depotFilter],
          and: true
        });

        const finalFilter = new Filter({
          filters: filters.length ? [orFilter, andFilter] : [andFilter],
          and: true
        });

        console.log(finalFilter);

        const table = this.byId("historyDialogTable");
        const binding = table.getBinding("items");

        if (binding) {
          binding.filter(finalFilter);
          binding.sort([
            new Sorter("PostingDate", true),
            new Sorter("PostingTime", true)
          ]);
        }

      },

      createRecentDateFilter(sPath, iDays) {
        // 1) compute cutoff = now − iDays
        var oNow = new Date();
        // optional: zero‐out the time if you want "midnight iDays ago"
        oNow.setHours(0, 0, 0, 0);
        var oCutoff = new Date(oNow.getTime() - (iDays * 24 * 60 * 60 * 1000));

        // 2) build a > (GT) filter
        return new sap.ui.model.Filter(
          sPath,
          sap.ui.model.FilterOperator.GT,
          oCutoff
        );
      },

      onHistoryClear() {
        console.log("onHistoryClear")
        this.byId("historySearch").setValue();
        // this.byId("historyDatePicker").setValue();
        this.onHistorySearch();
      },

      onHistoryFilterChange() {
        console.log("onHistoryFilterChange")
        this.onHistorySearch();
      },

      onHistorySearchChange() {
        console.log("onHistorySearchChange")
        this.onHistorySearch();
      },

      onHistoryDialogClose() {
        this.byId("historyDialog").close();
      },

      closeExceptionNotification() {
        const dialog = this.byId("exceptionNotificationDialog");
        dialog.close();
      },

      confirmExceptionNotification() {
        const reasonTextArea = this.byId("exceptionNotificationReason");
        const reason = reasonTextArea.getValue();
        const depot = this.byId("depotFilter").getValue();

        if (reason == null || reason == undefined || reason == "") {
          MessageToast.show(`Please enter a reason for the notification.`);
          return;
        }

        if (depot == null || depot == undefined || depot == "") {
          MessageToast.show(`Please enter a valid depot for the filter.`);
          return;
        }

        this.getModel().callFunction("/CreateRejectionNotif", {
          method: "GET",
          urlParameters: {
            Delivery: "",
            DeliveryPosnr: "",
            Equipment: "",
            SerialNumber: "",
            Depot: depot,
            LongText: reason,
          },
          success: function (oData, response) {
            // oData.Success ? console.log(oData.Message) : console.log("Notification Create Failed");

            console.log(oData, response);

            const notificationNumber = oData.CreateRejectionNotif.Text;

            MessageToast.show(
              `Notification was created successfully: ${notificationNumber}`,
            );
            reasonTextArea.setValue("");
            const dialog = this.byId("exceptionNotificationDialog");
            dialog.close();

            let oContext = this.getView().getBindingContext();
            let oComponent = this.getOwnerComponent();
            const oTarget = {
              target: {
                semanticObject: "GrGaNotifications",
                action: "Display",
              },
              params: {
                // "Depot": oContext.getProperty("Depot"),
                // "Delivery": oContext.getProperty("Delivery") + "/" + oContext.getProperty("DeliveryPosnr"),
                // "Equipment": oContext.getProperty("EquipmentID")
              },
              appSpecificRoute: `Detail/ZCDS_NOTIFICATIONS_GRGA('${notificationNumber}')`,
            };

            // const sHref = await this.oNavigationService.getHref(oTarget, oComponent);

            // oTarget.target.shellHash = sHref;

            // this.oNavigationService.navigate(oTarget, oComponent);

            this.sNotification = notificationNumber;
            this.uploadAllAttachments();
            // this.saveAnswers();
          }.bind(this),
          error: function (oError) {
            //
          }.bind(this),
        });
      },
      uploadAllAttachments: function () {
        let oUpload = this.byId("UploadSet");
        oUpload.setUploadUrl(
          this.getOwnerComponent().getModel().sServiceUrl + "/AttachmentSet",
        );

        if (oUpload) {
          let aItems = oUpload.getIncompleteItems();

          if (aItems.length > 0) {
            oUpload.upload();
          }
        }
      },

      onBeforeUploadStarts: function (oEvent) {
        const sNotification = this.sNotification;
        // const oContext = this.getView().getBindingContext();
        // const sDelivery = oContext.getProperty("Delivery");
        // const sDeliveryPosnr = oContext.getProperty("DeliveryPosnr");

        const oUploadSet = oEvent.getSource();
        const oItemToUpload = oEvent.getParameter("item");
        const oCustomerHeaderToken = new sap.ui.core.Item({
          key: "x-csrf-token",
          text: this.getModel().getSecurityToken(),
        });

        // Header Slug
        // const sFileName = "Deviation_" + sDelivery + "-" + sDeliveryPosnr + "_" + oItemToUpload.getFileName();
        const sFileName = oItemToUpload.getFileName();

        const oCustomerHeaderSlug = new sap.ui.core.Item({
          key: "slug",
          text: sFileName + ";" + sNotification,
        });

        oUploadSet.removeAllHeaderFields();
        oUploadSet.addHeaderField(oCustomerHeaderToken);
        oUploadSet.addHeaderField(oCustomerHeaderSlug);
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
