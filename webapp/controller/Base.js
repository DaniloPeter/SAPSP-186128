sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/core/message/Message",
    "com/segezha/form/roll/conversion/model/formatter",
    "com/segezha/form/roll/conversion/model/Utils",
  ],
  (Controller, Fragment, Message, formatter, Utils) => {
    "use strict";
    return Controller.extend(
      "com.segezha.form.roll.conversion.controller.Base",
      {
        formatter: formatter,
        utils: Utils,

        getOwnerComponent() {
          return Controller.prototype.getOwnerComponent.call(this);
        },
        getRouter() {
          return UIComponent.getRouterFor(this);
        },
        getResourceBundle() {
          const oModel = this.getOwnerComponent().getModel("i18n");
          return oModel.getResourceBundle();
        },
        getModel(sName) {
          const model = this.getView().getModel(sName);
          if (model) return model;
          else return this.getOwnerComponent().getModel(sName);
        },
        getStateProperty(sPath, oContext) {
          return this.getModel("state").getProperty(sPath, oContext);
        },
        setStateProperty(sPath, oValue, oContext, bAsyncUpdate) {
          return this.getModel("state").setProperty(
            sPath,
            oValue,
            oContext,
            bAsyncUpdate
          );
        },
        setModel(oModel, sName) {
          this.getView().setModel(oModel, sName);
          return this;
        },
        readOData(sPath, oParams) {
          return new Promise((resolve, reject) => {
            const oModel = this.getModel();
            oModel.read(sPath, {
              urlParameters: oParams ? oParams.urlParameters : null,
              filters: oParams ? oParams.filters : null,
              sorters: oParams ? oParams.sorters : null,
              success: resolve,
              error: reject,
            });
          });
        },

        sendData(sEntity, oEntry) {
          return new Promise((resolve, reject) => {
            const oModel = this.getModel();
            oModel.create(sEntity, oEntry, {
              method: "POST",
              success: resolve,
              error: reject,
            });
          });
        },

        callODataFunction(sFunctionName, mParameters, sMethodParam) {
          const sMethod = sMethodParam || "GET";
          return new Promise((resolve, reject) => {
            const oModel = this.getModel();
            oModel.callFunction(sFunctionName, {
              method: sMethod,
              urlParameters: mParameters,
              success: resolve,
              error: reject,
            });
          });
        },

        getDialog(sFragmentName) {
          if (this[sFragmentName]) {
            return new Promise((resolve) => {
              resolve(this[sFragmentName]);
            });
          } else {
            return this.__loadDialog(sFragmentName);
          }
        },

        __loadDialog(sFragmentName) {
          return Fragment.load({
            type: "XML",
            name:
              "com.segezha.form.roll.conversion.view.fragments." +
              sFragmentName,
            controller: this,
          }).then((oDialog) => {
            this[sFragmentName] = oDialog;
            this.getView().addDependent(this[sFragmentName]);
            return oDialog;
          });
        },

        onChangeCommonField(oEvent) {
          const oSource = oEvent.getSource ? oEvent.getSource() : oEvent,
            oModel = this.getModel();
          let oValue = "";
          let oBindingValue = null;

          if (oSource.getBinding("value")) {
            oValue = oSource.getValue();
            oBindingValue = oSource.getBinding("value");
          }
          if (oSource.getBinding("dateValue")) {
            oValue = oSource.getDateValue();
            oBindingValue = oSource.getBinding("dateValue");
          }
          if (oSource.getBinding("selectedKey")) {
            oValue = oSource.getSelectedKey();
            oBindingValue = oSource.getBinding("selectedKey");
          }

          const sBindingPath = oSource.getBindingContext().getPath(),
            sBindingValue = oBindingValue.getPath(),
            oSuggestionBinding = oSource.getBinding("suggestionRows"),
            iMinValue = oSource.getMin && oSource.getMin(),
            isRequired = oSource.getRequired && oSource.getRequired(),
            oItemTableBinding = oSource.getBindingContext("state"),
            sCustomCheckField = oSource.data("checkField");

          if (oValue === "error") {
            oSource.setValue("0");
            this.setStateProperty(`/errorFields/${sBindingValue}`, true);
            return;
          }

          let oFoundSomething = isRequired ? !!oValue : true;
          if (iMinValue !== undefined && isRequired) {
            oFoundSomething = this.utils.stringToNumber(oValue) > iMinValue;
          }
          if (oSuggestionBinding && oValue) {
            const aSuggestionRows = oSource.getSuggestionRows().map((o) => ({
              data: o.getBindingContext().getObject(),
              path: o.getBindingContext().getPath(),
            }));
            if (sCustomCheckField) {
              oFoundSomething = aSuggestionRows.find(
                (o) => o.data[sCustomCheckField] === oValue
              );
            } else {
              oFoundSomething = aSuggestionRows.find((o) =>
                o.path.includes(`${sBindingValue}='${oValue}'`)
              );
            }
          }

          let aSkipErrors = [sBindingValue];

          if (
            oFoundSomething &&
            oFoundSomething.data &&
            oFoundSomething.data.hasOwnProperty("Lgort") &&
            sBindingValue === "WpResource"
          ) {
            oModel.setProperty(
              `${sBindingPath}/Lgort`,
              oFoundSomething.data.Lgort
            );
            aSkipErrors.push("Lgort");
            this.setStateProperty("/errorFields/Lgort", false);
          }

          const hasError = !oFoundSomething;

          if (oItemTableBinding) {
            const sItemPath = oItemTableBinding.getPath();
            this.setStateProperty(
              `${sItemPath}/${sBindingValue}_error`,
              hasError
            );
          } else {
            this.setStateProperty(`/errorFields/${sBindingValue}`, hasError);
          }

          if (!hasError) {
            const oMessageManager = sap.ui.getCore().getMessageManager(),
              oMessageModel = oMessageManager.getMessageModel(),
              aMessagesData = oMessageModel.getData(),
              indexPosition = oItemTableBinding
                ? oItemTableBinding.getPath().split("/items/")[1]
                : "",
              sFieldName = indexPosition
                ? `${sBindingValue}_${indexPosition}`
                : sBindingValue;

            if (sFieldName === "Znewformat") {
              aSkipErrors.push(...["Zformat1", "Zformat2"]);
            }

            if (sFieldName === "Zpm" || sFieldName === "Zlengthreport") {
              aSkipErrors.push("Zstamp");
            }

            if (sFieldName === "Aufnr") {
              aSkipErrors.push("Klishe");
            }

            if (aMessagesData.length) {
              const aNewMessages = aMessagesData.filter((o) => {
                if (aSkipErrors.length > 1) {
                  return !aSkipErrors.includes(o.technicalDetails);
                }
                return o.technicalDetails !== sFieldName;
              });
              oMessageManager.removeMessages(aMessagesData);
              oMessageManager.addMessages(aNewMessages);
            }
          }

          return hasError;
        },

        onMessagePopoverPress() {
          const oButton = this.byId("btnMessagePopoverId");
          this.getDialog("MessagePopover").then((oDialog) =>
            setTimeout(() => oDialog.openBy(oButton), 0)
          );
        },

        __addErrorMessage(oMessage) {
          const oMessageTemplate = new Message({
            message: oMessage.message,
            additionalText: oMessage.additionalText || "",
            type: oMessage.type,
            code: oMessage.group,
            technicalDetails: oMessage.field,
            processor: this.getView().getModel(),
          });
          sap.ui.getCore().getMessageManager().addMessages(oMessageTemplate);
        },

        __clearMessages() {
          sap.ui.getCore().getMessageManager().removeAllMessages();
        },
      }
    );
  }
);
