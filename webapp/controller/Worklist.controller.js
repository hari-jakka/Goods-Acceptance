sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "../model/formatter",
    "sap/ui/core/Fragment",
    "sap/ui/model/type/String",
    'sap/m/SearchField',
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/GroupHeaderListItem",
    "sap/m/ColumnListItem",
    "sap/ui/table/Column",
    "sap/m/Column",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/MessageToast",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
], function (BaseController, JSONModel, Device, formatter, Fragment, TypeString, SearchField, Filter, FilterOperator, GroupHeaderListItem, ColumnListItem, UIColumn, MColumn, Label, Text, Dialog, Button, MessageToast, Sorter, MessageBox) {
    "use strict";

    return BaseController.extend("eu.aiden.ga.goodsacceptance.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit: function () {
            var oViewModel;
            this._depotInitialized = false;

            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                viewTitle: this.getResourceBundle().getText("lblGoodsAcceptance"),
                worklistTableTitle: this.getResourceBundle().getText("lblDeliveries"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText: this.getResourceBundle().getText("lblNoOpenDeliveries")
            });
            this.setModel(oViewModel, "worklistView");

            this._mViewSettingsDialogs = {};
            this._oSupplierFilter = {};
            let oView = this.getView();
            // if(Device.system.phone){
            //     this.getViewSettingsDialog("eu.aiden.ga.goodsacceptance.fragments.FilterDialog")
            //     	.then(function (oViewSettingsDialog) {
            //             let oController = oView.getController();
            //             oController._oSupplierFilter = oView.byId("supplierFilterPhone");
            //             oController._oDepotFilter = oView.byId("depotFilterPhone");
            //             oController._oSubGroupFilter = oView.byId("subGroupFilterPhone");
            //     });                
            // } else {
            this._oSupplierFilter = this.byId("supplierFilter");
            this._oDepotFilter = this.byId("depotFilter");
            this._oSubGroupFilter = this.byId("subgroupFilter");
            // }


            let oTable = this.byId("table");
            if (Device.system.phone) {
                oTable.setSticky(["HeaderToolbar", "InfoToolbar"]);
            } else {
                oTable.setSticky(["HeaderToolbar", "InfoToolbar", "ColumnHeaders"]);
            }

            this.oFilterBar = this.byId("filterbar");

            sap.ui.require(["sap/ushell/Container"], async (Container) => {
                const oUserInfoService = await Container.getServiceAsync("UserInfo");
                this.oUserInfoService = oUserInfoService;
            });

            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("worklist").attachPatternMatched(this._onBackToWorklist, this);
        },

        onAfterRendering: function () {
            try {
                const binding = this.byId("table").getBinding("items");
                binding.suspend();
            } catch (err) {
                (err);
            }
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
                sTitle = this.getResourceBundle().getText("lblDeliveriesCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("lblDeliveries");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        },

        mergeFunctionName: function (oEvent) {

        },

        getGroup: function (oContext) {
            return `${oContext.getProperty("DeliveryDocument")}  - ${oContext.getProperty("SupplierName")}`;
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress: function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack: function () {
            // eslint-disable-next-line fiori-custom/sap-no-history-manipulation, fiori-custom/sap-browser-api-warning
            history.go(-1);
        },

        onDepotChange: function (oEvent) {
            this.onSearch();
            // const sDepot = oEvent.getSource().getSelectedKey();

            // localStorage.setItem("default_depot", sDepot);

            // const sPath = "Depot";
            // const sOperator = "EQ";
            // const oBinding = this.byId("table").getBinding("items");
            // oBinding.filter([new sap.ui.model.Filter(sPath, sOperator, sDepot)]);

            // //  Update the title depot
            // const titleText = this.getView().getModel("i18n").getResourceBundle().getText("lblGoodsAcceptance");
            // this.byId("headingTitle").setText(`${titleText} - ${sDepot}`);            
        },

        // onDepotSuggest: function (oEvent) {
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

        //     // if (!sEmail) { // TODO: remove before when deploying
        //     //     sEmail = 'john.doe@aiden.eu';
        //     // }

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

        onDepotsRequested: function (oEvent) {
            // this._oDepotFilter.setBusy(true);
        },

        onDepotsReceived: function (oEvent) {
            // this._oDepotFilter.setBusy(false);
        },

        // initializeDepot: function () {
        //     // let sDepot = localStorage.getItem("default_depot");
        //     let sDepot = this.getOwnerComponent().userDepot;

        //     if (sDepot) {
        //         this._oDepotFilter.setSelectedKey(sDepot);
        //         this._oDepotFilter.setValue(sDepot);
        //         this.onSearch()
        //         this.setViewTitle(sDepot);
        //     }
        // },

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

            const sEmail = this.oUserInfoService.getEmail() || 'john.doe@aiden.eu';

            console.log(`Initializing depot for: ${sEmail}`);

            // oDataModel.setUseBatch(false);
            // Force a fresh backend request — bypass browser HTTP cache
            oDataModel.setHeaders({ "Cache-Control": "no-cache, no-store" });
            oDataModel.callFunction("/GetUserDepots", {
                method: "GET",
                urlParameters: {
                    Username: sEmail
                },
                success: function (oData, response) {
                    ("User depots loaded");

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
                        that._oDepotFilter.setValue(defaultDepotValue);
                        that.onSearch();
                    } else {
                        // No valid depot — clear the depot field and wipe any cached table data
                        that._oDepotFilter.setValue("");
                        that._oDepotFilter.setSelectedKey("");
                        const oTableBinding = that.byId("table").getBinding("items");
                        if (oTableBinding) {
                            // Apply an impossible filter, then resume to flush old cached results
                            oTableBinding.filter(new Filter("Depot", FilterOperator.EQ, "---"), "Application");
                            oTableBinding.resume();
                        }
                    }
                },
                error: function (oError) {
                    (oError);
                    // On error, apply impossible filter so no deliveries are shown unfiltered
                    const oTableBinding = that.byId("table").getBinding("items");
                    if (oTableBinding) {
                        oTableBinding.filter(new Filter("Depot", FilterOperator.EQ, "---"), "Application");
                        oTableBinding.resume();
                    }
                }
            });
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

            this._oDepotFilter
                .getBinding("suggestionItems")
                .filter(new Filter(filters));
        },

        onSubGroupSuggest: function (oEvent) {
            const sTerm = oEvent.getParameter("suggestValue");
            let aFilters = [];
            if (sTerm) {
                aFilters.push(new Filter("SubGroup", FilterOperator.Contains, sTerm));
            }

            const oFilter = new Filter({
                filters: aFilters,
                and: false
            })

            oEvent.getSource().getBinding("suggestionItems").filter(oFilter);
        },

        onSupplierSuggest: function (oEvent) {
            const sTerm = oEvent.getParameter("suggestValue");
            let aFilters = [];
            if (sTerm) {
                aFilters.push(new Filter("SupplierName", FilterOperator.Contains, sTerm));
            }

            const oFilter = new Filter({
                filters: aFilters,
                and: false
            })

            oEvent.getSource().getBinding("suggestionItems").filter(oFilter);
        },



        setViewTitle: function () {
            // let sDepot = this._oDepotFilter.getSelectedKey();
            const sDepot = localStorage.getItem("defaultDepotValue");
            var sViewTitle = this.getResourceBundle().getText("lblGoodsAcceptance") + " - " + sDepot;
            this.getModel("worklistView").setProperty("/viewTitle", sViewTitle);
        },

        onScanSuccess: function (oEvent) {
            if (oEvent.getParameter("cancelled")) {
                MessageToast.show("Scan cancelled", { duration: 1000 });
            } else {
                if (oEvent.getParameter("text")) {
                    let sValue = oEvent.getParameter("text");
                    if (sValue.search("/u/" !== -1)) {                  // "/u/" geeft aan dat er een uniek serienummer in de QR zit
                        let sSerial = sValue.split("/").pop(); //Laatste deel van de url string uit QR is het serienummer
                        this.byId("inpSerial").setValue(sSerial);
                    } else {
                        this.byId("searchField").setValue(sValue);
                    }
                    this.onSearch();
                }
            }
        },

        onScanError: function (oEvent) {
            MessageToast.show("Scan failed: " + oEvent, { duration: 1000 });
        },

        // onFilterButtonPressed: function () {
        // 	this.getViewSettingsDialog("eu.aiden.ga.goodsacceptance.fragments.FilterDialog")
        // 		.then(function (oViewSettingsDialog) {
        // 			oViewSettingsDialog.open();
        // 	});
        // },

        // onFilterDialogGo: function(){
        //     this.onSearch();
        //     this.onCloseFilterDialog();
        // },

        // onCloseFilterDialog: function(){
        //     this.byId("filterDialog").close();
        // },

        // getViewSettingsDialog: function (sDialogFragmentName) {
        // 	var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];
        //     let oView = this.getView();

        // 	if (!pDialog) {
        // 		pDialog = Fragment.load({
        // 			id: this.getView().getId(),
        // 			name: sDialogFragmentName,
        // 			controller: this
        // 		}).then(function (oDialog) {
        // 			if (Device.system.desktop) {
        // 				oDialog.addStyleClass("sapUiSizeCompact");
        // 			} else {
        //                 oDialog.addStyleClass("sapUiSizeCozy");
        //             }
        //             oView.addDependent(oDialog);
        // 			return oDialog;
        // 		});
        // 		this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
        //         // this.getView().addDependent(pDialog);
        // 	}
        // 	return pDialog;
        // },        

        onSearch: function () {
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
                return;
            }

            const oDepotsModel = this._oDepotFilter.getModel("depots");
            if (!oDepotsModel) {
                return;
            }
            if (!oDepotsModel.getData().results.some(item => item.Kunnr == depot)) {
                if (this._depotInitialized) {
                    // Depot was removed from user's access — reset
                    localStorage.setItem("defaultDepot", "---");
                    localStorage.setItem("defaultDepotValue", "---");
                    this._oDepotFilter.setValue(null);
                }
                return;
            }


            localStorage.setItem("defaultDepot", depot);
            localStorage.setItem("defaultDepotValue", this._oDepotFilter.getValue());

            this._oSubGroupFilter.getBinding("items").filter(new Filter("Depot", "EQ", depot));
            this._oSupplierFilter.getBinding("items").filter(new Filter("Depot", "EQ", depot));

            if (this.getSearchFilters()) {
                aAllFilters.push(this.getSearchFilters());
            }

            if (this.getDepotFilters()) {
                aAllFilters.push(this.getDepotFilters());
                this.setViewTitle();
            }

            if (this.getSubGroupFilters()) {
                aAllFilters.push(this.getSubGroupFilters());
            }

            if (this.getSupplierFilters()) {
                aAllFilters.push(this.getSupplierFilters());
            }

            var oTotalFilter = new Filter({
                filters: aAllFilters,
                and: true
            });

            this._applySearch(oTotalFilter);
        },

        getSearchFilters: function () {
            let sQuery = this.byId("searchField").getValue();
            // oTableSearchState;

            if (sQuery && sQuery.length > 0) {
                let oTableSearchState = new Filter({
                    filters: [
                        new Filter("DeliveryDocument", FilterOperator.Contains, sQuery),
                        //new Filter("SupplierName", FilterOperator.Contains, sQuery),
                        new Filter("MaterialDescription", FilterOperator.Contains, sQuery),
                        new Filter("MaterialNumber", FilterOperator.Contains, sQuery),
                        new Filter("PurchaseOrder", FilterOperator.Contains, sQuery),
                        new Filter("SupplierSerialnumber", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                })
                return oTableSearchState;
            }
        },

        getDepotFilters: function () {
            let sDepot = this._oDepotFilter.getSelectedKey();

            if (sDepot === '') {
                sDepot = this._oDepotFilter.getValue();
            }

            if (sDepot.length !== 0) {
                let oDepotFilter = new Filter({ path: "Depot", operator: "EQ", value1: sDepot });
                return oDepotFilter;
            }
        },

        getSubGroupFilters: function () {
            let sSubGroup = this._oSubGroupFilter.getSelectedKey();

            if (sSubGroup.length !== 0) {
                let oSubGroupFilter = new Filter({ path: "SubGroup", operator: "EQ", value1: sSubGroup });
                return oSubGroupFilter;
            }
        },

        getSupplierFilters: function () {
            let sSupplier = this._oSupplierFilter.getSelectedKey();

            if (sSupplier.length !== 0) {
                let oSupplierFilter = new Filter({ path: "SupplierName", operator: "EQ", value1: sSupplier });
                return oSupplierFilter;
            }
        },

        onClearFB: function (oEvent) {
            this._oSubGroupFilter.setSelectedKey();
            this._oSupplierFilter.setSelectedKey();
            this.onSearch();
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
                return
            };

            const filters = [];

            if (search) {
                filters.push(new Filter("Supplier", FilterOperator.Contains, search));
                filters.push(new Filter("SupplierName", FilterOperator.Contains, search));
                filters.push(new Filter("DeliveryDocument", FilterOperator.Contains, search));
                filters.push(new Filter("Material", FilterOperator.Contains, search));
                filters.push(new Filter("MaterialDescription", FilterOperator.Contains, search));
                filters.push(new Filter("Subgroup", FilterOperator.Contains, search));
                filters.push(new Filter("SerialNumber", FilterOperator.Contains, search));
                filters.push(new Filter("VendorSerialNumber", FilterOperator.Contains, search));
                filters.push(new Filter("PostedBy", FilterOperator.Contains, search));
                filters.push(new Filter("Make", FilterOperator.Contains, search));
                filters.push(new Filter("Model", FilterOperator.Contains, search));
            }

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
            this.byId("historyDatePicker").setValue();
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

        onIncidentType01: function (oEvent) {
            const that = this;
            this.incidentTypeDialog01 = this.createTopdeskDialog("incidentTypeDialog01", "01", () => { }, () => {
            });
            this.incidentTypeDialog01.open();
        },

        onIncidentType08: function (oEvent) {

            const that = this;
            this.incidentTypeDialog08 = this.createTopdeskDialog("incidentTypeDialog08", "08", () => {
                // const model = that.getModel();
                // model.refresh();


                if (this.saveAnswers) {
                    this.saveAnswers();
                }
            }, () => {
            });
            this.incidentTypeDialog08.open();
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

        mergeColumn: function (AAA) {
        },

        getGroupHeader: function (oGroup) {
            let sTitle = "";

            if (Device.system.phone) {
                sTitle = this.getResourceBundle().getText("columnTitleDelivery") + " " + oGroup.key;
            } else {
                sTitle = oGroup.key;
            }

            return new GroupHeaderListItem({ title: `${oGroup.key}` });
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        _onBackToWorklist: function () {
            this.initializeDepot();
        },

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject: function (oItem) {
            console.log("_showObject");
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getPath().substring("/ZOPEN_DELIVERY_OVERVIEW_GA".length)
            });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private/
         */
        _applySearch: function (aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("lblNoOpenDeliveries"));
            }
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

        onBeforeUploadStarts: function (oEvent) {

            const sNotification = this.sNotification;

            const oUploadSet = oEvent.getSource();
            const oItemToUpload = oEvent.getParameter("item");
            const oCustomerHeaderToken = new sap.ui.core.Item({
                key: "x-csrf-token",
                text: this.getModel().getSecurityToken()
            });


            // Header Slug
            const sFileName = oItemToUpload.getFileName();

            const oCustomerHeaderSlug = new sap.ui.core.Item({
                key: "slug",
                text: sFileName + ";" + sNotification
            });

            oUploadSet.removeAllHeaderFields();
            oUploadSet.addHeaderField(oCustomerHeaderToken);
            oUploadSet.addHeaderField(oCustomerHeaderSlug);
        },
    });
});

function formatName(firstName, lastName) {
    if (firstName) {
        return `${lastName}, ${firstName}`;
    } else {
        return lastName;
    }
}