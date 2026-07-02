sap.ui.define(["sap/ui/core/format/DateFormat"], function (DateFormat) {
    "use strict";

    return {

        /**
         * Rounds the number unit value to 2 digits
         * @public
         * @param {string} sValue the number string to be rounded
         * @returns {string} sValue with 2 digits rounded
         */
        numberUnit : function (sValue) {
            if (!sValue) {
                return "";
            }
            return parseFloat(sValue).toFixed(2);
        },

        overdueHighlight: function(iDays){
            let sState = "None";
            if(iDays > 0 ){
                sState = "Error"
            }
            return sState;
        },

        hideWhenBulk: function(EquipmentID){
            return EquipmentID === '1' ? false : true;
        },

        showWhenBulk: function(EquipmentID){
            return EquipmentID === '1' ? true : false;
        },        

        EquipmentIDWhenBulk: function(EquipmentID){
            return EquipmentID === '1' ? '' : EquipmentID;
        },

        EquipmentIntro: function(labelText, EquipmentID){
            if(EquipmentID === '1'){
                return ''
            } else {
                return labelText + ": " + EquipmentID
            }
        },

        showTotalQty: function(data){

        },

        showOpenQty: function(data){
            if(data === null || data === undefined){
                return;
            }

            let bVisible = false;
            if(!data.BulkDelivery && data.EquipmentID === '1'){
                bVisible = true;
            }

            return bVisible;
        },

        questionStatusIcon: function(sStatus){
            let sIconSrc = '';
            switch (sStatus) {
                case "Warning":
                    sIconSrc = "sap-icon://alert";
                    break;                
                case "Success":
                    sIconSrc = "sap-icon://accept";
                    break;
                case "Error":
                    sIconSrc = "sap-icon://decline"
                    break;
                default:
                    sIconSrc = "";
                    break;
            }
            return sIconSrc;
        },

        questionStatusColor: function(sStatus){
            let sColor = '';
            switch (sStatus) {
                case "Warning":
                    sColor = "Critical";
                    break;                     
                case "Success":
                    sColor = "Positive";
                    break;
                case "Error":
                    sColor = "Negative"
                    break;
                default:
                    sColor = "Neutral";
                    break;
            }
            return sColor;
        },

        validStatusIcon: function(bValid){
            let sIconSrc = 'sap-icon://decline';

            if(bValid){
                sIconSrc = "sap-icon://accept";
            }

            return sIconSrc;
        },

        validStatusColor: function(bValid){
            let sColor = 'Negative';

            if(bValid){
                sColor = "Positive"
            }

            return sColor;
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