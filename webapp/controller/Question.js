sap.ui.define([
    "sap/m/CustomListItem",   
    "sap/ui/core/ListItem", 
    "sap/m/HBox",
    "sap/m/VBox",    
    "sap/m/Label",
    "sap/m/Title",
    "sap/m/Select",
    "sap/m/Input",
    "sap/m/CheckBox",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/DatePicker",
    "sap/ui/core/ValueState",
    "sap/ui/core/Icon"
], 
    function(CustomListItem, ListItem, HBox, VBox, Label, Title, Select, Input, CheckBox, List, StandardListItem, DatePicker, ValueState, Icon) {
 
    let oQuestion = {};
 
    oQuestion.createQuestionLine = function(sId, oContext, bPhone){
        // let bPhone = this.controller.getOwnerComponent().getModel("device").getProperty("/system/phone");
        // this.rowNumber = sId.split("questionTable-")[1];
        const aRowId = sId.split("questionTable")[1].split("-");

        this.identifier = aRowId[0];   // "Main" or "CompItem"
        this.rowNumber = aRowId[1];
        this.oDisplay = oContext.getProperty("to_AnswersDisplay");

        if(!this.oDisplay){
            this.oDisplay= {
                Visible: true,
                Required: false
            };
        }

        var oLine = new CustomListItem({id: sId});
        var oLineContent = {};

        if(bPhone){
            oLineContent = this.getLinePhone(oContext);
        } else {
            oLineContent = this.getLinePcTablet(oContext);
            // oLine.addStyleClass("sapUiLargeMarginBeginEnd");
        }

        oLine.addContent(oLineContent);
        return oLine;
    },

    oQuestion.getLinePhone = function(oContext){
        var oVBox = new VBox({
            id: "QuestionHBox" + this.identifier + "-" + this.rowNumber,
            width: "100%",
            visible: this.oDisplay.Visible,
        }).addStyleClass("sapUiMediumMarginTopBottom");

        var oQuestionBox = new HBox();
        oQuestionBox.addItem( new Label({text: "", required: this.oDisplay.Required, width: "1rem"}));
        oQuestionBox.addItem( new Title({text: this.getQuestionText(oContext)}));
        oVBox.addItem(oQuestionBox);

        let oAnswerBox = new HBox({
            justifyContent: "End",
            alignItems: "Center"
        }); //{width: "20rem"})
        let oAnswerControl = this._getAnswerControl(oContext).setWidth("15rem");
        let oIndicatorControl = this._getAnswerIndicator().addStyleClass("sapUiTinyMarginBegin");
        oAnswerControl.oIndicatorControl = oIndicatorControl

        oAnswerBox.addItem(oAnswerControl);
        oAnswerBox.addItem(oIndicatorControl);

        oVBox.addItem(oAnswerBox);
        return oVBox;
    },

    oQuestion.getLinePcTablet = function(oContext){
        let oHBox = new HBox({
            id: "QuestionHBox" + this.identifier + "-" + this.rowNumber,
            visible: this.oDisplay.Visible,
            alignItems: "Center",
            justifyContent: "SpaceBetween"
        }).addStyleClass("sapUiResponsiveMargin");            
        // }).addStyleClass("sapUiMediumMarginTopBottom sapUiLargeMarginBeginEnd");

        let oQuestionBox = new HBox({width: "20rem"}).addStyleClass("sapUiLargeMarginBegin");
        oQuestionBox.addItem( new Label({text: "", required: this.oDisplay.Required, width: "1rem"}));
        oQuestionBox.addItem( new Title({text: this.getQuestionText(oContext)}));
        oHBox.addItem(oQuestionBox);

        let oAnswerBox = new HBox({
            alignItems: "Center"
        }).addStyleClass("sapUiLargeMarginEnd"); 
        let oAnswerControl = this._getAnswerControl(oContext).setWidth("15rem");
        let oIndicatorControl = this._getAnswerIndicator().addStyleClass("sapUiTinyMarginBegin");
        oAnswerControl.oIndicatorControl = oIndicatorControl

        oAnswerBox.addItem(oAnswerControl);
        oAnswerBox.addItem(oIndicatorControl);

        oHBox.addItem(oAnswerBox);
        return oHBox;
    },

    oQuestion._getAnswerIndicator = function(){
        let sIndicatorId = this.viewId + "--answerIndicatorControl" + this.identifier + "-" + this.rowNumber;

        let oIcon = new Icon({
            id: sIndicatorId,
            src: "sap-icon://accept"
        });

        oIcon.setAsOk = function(){
            this.setSrc("sap-icon://accept");
            this.setColor("Positive");
        }

        oIcon.setAsDeviation = function(){
            this.setSrc("sap-icon://decline");
            this.setColor("Negative");
        }

        oIcon.setAsOk();

        return oIcon;
    },

    oQuestion._getAnswerControl = function(oContext){
        let sAnswerControlId = this.viewId + "--answerControl" + this.identifier + "-" + this.rowNumber;
        let oAnswerControl = new VBox();

        if(!this.oDisplay){
            return oAnswerControl;
        }

        switch (this.oDisplay.ControlType) {
            case "CE":
                oAnswerControl = this._getCEControl(sAnswerControlId, oContext);
                break;
            case "LE":
                oAnswerControl = this._getLEControl(sAnswerControlId, oContext);
                // Select
                break;
            case "VE":
                oAnswerControl = this._getVEControl(sAnswerControlId, oContext);
                break;         
            case "CM":
                //  Input
                break;   
            case "LM":
                oAnswerControl = this._getLMControl(sAnswerControlId, oContext);
                break;    
            case "VM":
                
                break;                                                                        
            default:
                break;
        }

        // remember the questionText in oAnswerControl
        let oQuestion = {
            questionText: oContext.getProperty("QuestionText"),
            referenceValue: oContext.getProperty("ReferenceValue")
        }
        oAnswerControl.oQuestion = oQuestion;

        return oAnswerControl;
    } 

    oQuestion._getCEControl = function(sAnswerControlId, oContext){
        var oCheckBox = new CheckBox({
            id: sAnswerControlId,
            visible: this.oDisplay.Visible,
            ValueState: ValueState.None
        })

        if(this.oDisplay.DefaultValue === "Y"){
            oCheckBox.setSelected(true);
            oCheckBox.BoelsDefaultValue = this.oDisplay.DefaultValue;
        }

        oCheckBox.getAnswer = function(){
            let sAnswer = this.getSelected() ? "Y" : "";
            return sAnswer;
        }

        oCheckBox.getDeviation = function(){
            let bDeviation = false;
            let sAnswer = this.getSelected() ? "Y" : "";
            if(sAnswer !== this.BoelsDefaultValue){
                bDeviation = true;
            }
            return bDeviation;
        }

        oCheckBox.getDeviationText = function(){
            let sText = this.oQuestion.questionText + ": ";
            sText += this.getSelected();
            return sText;
        }            

        oCheckBox.oIndicatorControl = {}; //will be filled later
        oCheckBox.attachSelect(function(){
            if(this.getDeviation()){
                this.oIndicatorControl.setAsDeviation();
            } else {
                this.oIndicatorControl.setAsOk();
            }
        });

        return oCheckBox;
    }      

    // oQuestion._getCEControl = function(sAnswerControlId, oContext){
    //     var oSwitch = new sap.m.Switch({
    //         id: sAnswerControlId,
    //         visible: this.oDisplay.Visible,
    //         // ValueState: ValueState.None,
    //         type: 'AcceptReject',
    //         customTextOn: this.controller.getResourceBundle().getText("switchStateYes"),
    //         customTextOff: this.controller.getResourceBundle().getText("switchStateNo")
    //     })

    //     let bSwitchState = this.oDisplay.DefaultValue === "Y" ? true : false;
    //     oSwitch.setState(bSwitchState);

    //     oSwitch.getAnswer = function(){
    //         let sAnswer = this.getState() ? "Y" : "";
    //         return sAnswer;
    //     }

    //     oSwitch.getStateText = function(){
    //         if(this.getState()){
    //             return this.getCustomTextOn();
    //         } else {
    //             return this.getCustomTextOff();
    //         };
    //     }

    //     let oHBox = new HBox({alignItems: "Center"}).addItem(oSwitch);

    //     const sTextId = sAnswerControlId + "_text";
    //     const oText = new sap.m.Label({
    //         id: sTextId,
    //         text: oSwitch.getStateText()
    //     }).addStyleClass("sapUiSmallMarginBegin");

    //     oSwitch.attachChange(function(oEvent){
    //         const sText = oEvent.getSource().getStateText();
    //         this.byId(sTextId).setText(sText);
    //     }.bind(this.controller));

    //     oHBox.addItem(oText);
    //     return(oHBox);
    // }      

    // oQuestion._getLEControl = function(oContext,rowNumber,sId){    

    //     var oTemplate = new sap.ui.core.ListItem({
    //         key: "{Value}",
    //         // text: "{Description}",
    //         // additionalText: "{Value}"
    //     });            

    //     var that = this;

    //     var oSelect = new Select({
    //         id: this.viewId +"--answerControl-" + rowNumber,
    //         forceSelection: "false",
    //         visible: oDisplay.Visible,
    //         ValueState: "None",
    //         items: {
    //             path: "to_Question/to_answers",
    //             template: oTemplate,
    //             templateShareable: false,
    //             events: {
    //                 change: function(oEvent){
    //                 }.bind(that)
    //             }
    //         }
    //     }).addStyleClass("sapUiLargeMarginEnd");

    //     if(oDisplay.DefaultValue === "R"){
    //         oSelect.setSelectedKey(oContext.getProperty("ReferenceValue"));
    //     }

    //     if(oDisplay.RowDisplay === "A" || oDisplay.RowDisplay === "O"){
    //         oTemplate.bindProperty("text", "Description");
    //         oSelect.setShowSecondaryValues(true);
    //     }
    //     if(oDisplay.RowDisplay === "A"){
    //         oTemplate.bindProperty("additionalText", "Value");
    //     }            
    //     if(oDisplay.RowDisplay === "K"){
    //         oTemplate.bindProperty("text", "Value");
    //     }


    //     oSelect.getAnswer = function(){
    //         return this.getSelectedKey();
    //     }

    //     return oSelect;
    // }

    oQuestion._getLEControl = function(sAnswerControlId, oContext){    
        var oModel = oContext.getModel();

        var oSelect = new Select({
            id: sAnswerControlId,
            forceSelection: "false",
            visible: this.oDisplay.Visible,
            ValueState: ValueState.None
        })

        if(this.oDisplay.DefaultValue === "E"){
            oSelect.addItem(new ListItem({}));
        }        

        var aAnswerPath = oContext.getProperty("to_Answers");
        for (let i = 0; i < aAnswerPath.length; i++) {
            var oAnswer = oModel.getObject("/" + aAnswerPath[i]);

            var oItem = new ListItem({
                key: oAnswer.Value
            })

            if(this.oDisplay.RowDisplay === "A" || this.oDisplay.RowDisplay === "O"){
                oItem.setText(oAnswer.Description);
                oSelect.setShowSecondaryValues(true);
            }      
            
            if(this.oDisplay.RowDisplay === "A"){
                oItem.setAdditionalText(oAnswer.Value);
            }                
            
            if(this.oDisplay.RowDisplay === "K"){
                oItem.setText(oAnswer.Value);
            }            
            oSelect.addItem(oItem);
        }

        switch (this.oDisplay.DefaultValue) {
            case "R":
                oSelect.setSelectedKey(oContext.getProperty("ReferenceValue"));
                break;
            case "Y":
                oSelect.setSelectedKey(this.oDisplay.DefaultValue);
                break;
            case "N":
                oSelect.setSelectedKey(this.oDisplay.DefaultValue);
                break;
            default:
                break;
        }
        oSelect.BoelsDefaultValue = oSelect.getSelectedKey();
        // if(this.oDisplay.DefaultValue === "R"){
        //     oSelect.setSelectedKey(oContext.getProperty("ReferenceValue"));
        // }

        oSelect.getAnswer = function(){
            return this.getSelectedKey();
        }

        oSelect.getDeviation = function(){
            let bDeviation = false;
            let sAnswer = this.getSelectedKey();
            if(sAnswer !== this.BoelsDefaultValue){
                bDeviation = true;
            }
            return bDeviation;
        }

        oSelect.getDeviationText = function(){
            let sText = this.oQuestion.questionText + ": ";
            sText += this.getSelectedItem().getText();
            return sText;
        }        

        oSelect.resetAnswer = function(){
            this.setSelectedKey(this.oDisplay.DefaultValue);
        }

        oSelect.oIndicatorControl = {}; //will be filled later
        oSelect.attachChange(function(){
            if(this.getDeviation()){
                this.oIndicatorControl.setAsDeviation();
            } else {
                this.oIndicatorControl.setAsOk();
            }
        });

        return oSelect;
    }

    oQuestion._getVEControl = function(sAnswerControlId, oContext){
        var oControl = {};

        switch(this.oDisplay.DataType) {
            case "CHAR":
                oControl = this._getVEInput(sAnswerControlId, oContext);
                break;
            case "NUM":
                oControl = this._getVEInput(sAnswerControlId, oContext);
                break;
            case "DATE":
                oControl = this._getVEDate(sAnswerControlId, oContext);
                break;                                
        }           
        return oControl;
    }

    oQuestion._getVEInput = function(sAnswerControlId, oContext){
        var oInput = new Input({
            id: sAnswerControlId,
            visible: this.oDisplay.Visible,
            ValueState: ValueState.None
        });      

        if(this.oDisplay.length !== 0){
            oInput.setMaxLength(this.oDisplay.length);
        }

        if(this.oDisplay.DataType === "NUM"){
            oInput.setType("Number");
        }

        if(this.oDisplay.DefaultValue === "R"){
            oInput.setValue(oContext.getProperty("ReferenceValue"));
        } else {
            oInput.setValue("");
        }
        this.BoelsDefaultValue = oInput.getValue();

        oInput.getAnswer = function(){
            return this.getValue();
        }       
        
        oInput.getDeviation = function(){
            let bDeviation = false;
            let sAnswer = this.getValue();
            if(sAnswer !== this.BoelsDefaultValue && this.BoelsDefaultValue !== '' && this.BoelsDefaultValue != null && this.BoelsDefaultValue != undefined){
                bDeviation = true;
            }
            return bDeviation;
        }

        oInput.getDeviationText = function(){
            let sText = this.oQuestion.questionText + ": ";
            sText += this.getValue();
            return sText;
        }        

        oInput.resetAnswer = function(){
            // this.setValue(this.oDisplay.DefaultValue);
        }

        oInput.oIndicatorControl = {}; //will be filled later
        oInput.attachSubmit(function(){
            if(this.getDeviation.bind(oInput)()){
                this.oIndicatorControl.setAsDeviation();
            } else {
                this.oIndicatorControl.setAsOk();
            }
        });

        return oInput;  
    }

    oQuestion._getVEDate = function(sAnswerControlId, oContext){
        var oDatePicker = new DatePicker({
            id: sAnswerControlId,
            showCurrentDateButton: true,
            displayFormat : "dd-MM-yyyy",
            valueFormat : "yyyyMMdd"
        })
        oDatePicker.getAnswer = function(){
            return this.getValue();
        }   
        return oDatePicker;
    }

    oQuestion._getLMControl = function(sAnswerControlId, oContext){    
        var oTemplate = new StandardListItem({
            highlight: "None"
            // title: "{Description}",
            // info: "{Value}"
        });

        if(this.oDisplay.RowDisplay === "A" || this.oDisplay.RowDisplay === "O"){
            oTemplate.bindProperty("title", "Description");
        }
        if(this.oDisplay.RowDisplay === "K"){
            oTemplate.bindProperty("title", "Value");
        }
        if(this.oDisplay.RowDisplay === "A"){
            oTemplate.bindProperty("info", "Value");
        }

        var oSelect = new List({
            id: sAnswerControlId,
            mode: "MultiSelect",
            showSeparators: "None",
            visible: this.oDisplay.Visible,
            items: {
                path: "to_Answers",
                template: oTemplate,
                templateShareable: false,
            }
        })

        oSelect.getAnswer = function(){
            // return this.getSelectedKey();
        }

        return oSelect;
    }
    
    oQuestion.getQuestionText= function(oContext){
        let sReturnText = oContext.getProperty("QuestionLongText");
        sReturnText = sReturnText !== "" ? sReturnText : oContext.getProperty("QuestionText");
        // Ensure the question ends with a "?"
        if(sReturnText.indexOf("?") === -1){
            sReturnText = sReturnText + "?";
        }
        return sReturnText;
    }
     
    return oQuestion;
});