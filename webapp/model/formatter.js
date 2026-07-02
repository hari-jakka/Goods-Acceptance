sap.ui.define(["sap/ui/core/format/DateFormat"], function (DateFormat) {
  "use strict";

  return {
    /**
     * Rounds the number unit value to 2 digits
     * @public
     * @param {string} sValue the number string to be rounded
     * @returns {string} sValue with 2 digits rounded
     */
    numberUnit: function (sValue) {
      if (!sValue) {
        return "";
      }
      return parseFloat(sValue).toFixed(0);
    },

    ComponentQuantity: function (sValue) {
      const openQuantity = this.getView().byId("openqty_chk").getText();
      return parseFloat(sValue).toFixed(0) * parseInt(openQuantity);
    },

    IntegerOrFloat(num) {
      return parseFloat(parseFloat(num).toFixed(3))
        .toString()
        .replace(".", ",");
    },

    formatMsTime: function (oTimeObj) {
      if (!oTimeObj || oTimeObj.ms == null) {
        return "";
      }
      // Build a Date at UTC midnight + your ms
      var oDate = new Date(Date.UTC(1970, 0, 1) + oTimeObj.ms);
      var oFormatter = DateFormat.getTimeInstance({
        pattern: "HH:mm:ss", // or "HH:mm"
        UTC: true            // since we built a UTC date
      });
      return oFormatter.format(oDate);
    },

    iconForStatus: function (sStatus) {
      switch (sStatus) {
        case "A": return "sap-icon://pause";
        case "B": return "sap-icon://message-error";
        case "C": return "sap-icon://message-success";
        default: return "sap-icon://question-mark";
      }
    },

    colorForStatus: function (sStatus) {
      switch (sStatus) {
        case "A": return "orange";
        case "B": return "red";
        case "C": return "green";
        default: return "gray";
      }
    }
  };
});
