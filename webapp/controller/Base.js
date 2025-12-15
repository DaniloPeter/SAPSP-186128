sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "com/segezha/form/roll/conversion/model/formatter",
    "com/segezha/form/roll/conversion/model/Utils",
    "com/segezha/form/roll/conversion/model/Storage",
  ],
  (Controller, Fragment, MessageBox, formatter, Utils, Storage) => {
    "use strict";
    return Controller.extend(
      "com.segezha.form.roll.conversion.controller.Base",
      {
        formatter: formatter,
        utils: Utils,
        storage: Storage,

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
        setBusy(bBusy) {
          this.getView().setBusy(bBusy);
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
          const oModel = this.getModel(),
            oSource = oEvent.getSource ? oEvent.getSource() : oEvent,
            isOnlyValueHelp = oSource.getValueHelpOnly && oSource.getValueHelpOnly(),
            aMetaFields =
              oModel.oMetadata._getEntityTypeByPath(
                "/OPER_CONV_ROOLSet"
              ).property;

          let oValue = "",
            oBindingValue = null;

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

          const sBindingValue = oBindingValue.getPath(),
            oFoundType = aMetaFields.find(
              (o) =>
                o.name === sBindingValue &&
                (o.type.includes("Int") || o.type.includes("Decimal"))
            ),
            oSuggestionBinding = oSource.getBinding("suggestionRows"),
            iMinValue = oSource.getMin && oSource.getMin(),
            isRequired = oSource.getRequired && oSource.getRequired(),
            oItemTableBinding = oSource.getBindingContext("state"),
            sCustomCheckField = oSource.data("checkField");

          if (oFoundType && oValue === "") {
            oSource.setValue("0");
            if (isRequired) {
              this.setStateProperty(`/errorFields/${sBindingValue}`, true);
            }
            return;
          }

          if (oValue === "error") {
            oSource.setValue("0");
            this.setStateProperty(`/errorFields/${sBindingValue}`, true);
            return;
          }

          let oFoundSomething = isRequired ? !!oValue : true;
          if (iMinValue !== undefined && isRequired) {
            oFoundSomething = this.utils.stringToNumber(oValue) > iMinValue;
          }
          if (oSuggestionBinding && oValue && !isOnlyValueHelp) {
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
            this.__oMessageModel.__filterMessages({
              bindingValue: sBindingValue,
              tableBinding: oItemTableBinding,
            });
          }

          this.__attachPropertyChange();

          return hasError;
        },

        getFormData() {
          const oModel = this.getModel(),
            oBindingData = this.getView().getBindingContext().getObject(),
            aTableData = this.getStateProperty("/tables"),
            oSwitches = this.getStateProperty("/switches"),
            oDefects = aTableData.defect,
            oDownTimes = aTableData.downTime;

          const aIgnoredFields = [
              "__metadata",
              "Idconvroll",
              "Zfullnameqa",
              "toDefect",
              "toDowntime",
              "QMSet",
              "BRIGSet",
            ],
            aMetaFields =
              oModel.oMetadata._getEntityTypeByPath(
                "/OPER_CONV_ROOLSet"
              ).property,
            oFormData = Object.entries(oBindingData)
              .filter(([key]) => !aIgnoredFields.includes(key))
              .reduce((acc, [key, value]) => {
                const oMetaField = aMetaFields.find((o) => o.name === key);
                switch (oMetaField?.type) {
                  case "Edm.Decimal":
                    value = value || "0";
                    break;
                  case "Edm.Int16":
                    value = +value || 0;
                    break;
                  case "Edm.Int32":
                    value = +value || 0;
                    break;
                  default:
                    break;
                }
                return { ...acc, [key]: value };
              }, {});

          if (oSwitches.defect) {
            oFormData.toDefect = this.__mappingPositions(oDefects);
          }
          if (oSwitches.downTime) {
            oFormData.toDowntime = this.__mappingPositions(oDownTimes);
          }

          return oFormData;
        },

        __mappingPositions(oEntryPosition) {
          const { items } = oEntryPosition;
          return items.map((o) => {
            return Object.entries(o).reduce((acc, [key, value]) => {
              if (key.includes("error")) {
                return acc;
              }
              acc[key] = value;
              if (value && value.getDate) {
                acc[key] = this.utils.fromDateToEdmTime(value);
              }
              return acc;
            }, {});
          });
        },

        saveStorageData(key, data, errors = null) {
          const saveData = async () => {
            try {
              await this.storage.saveData(key, data, errors);
            } catch (oError) {
              const sErrorText = oError.error;
              if (sErrorText) {
                MessageBox.error(sErrorText);
              }
            }
          };

          saveData();
        },

        onMessagePopoverPress() {
          const oButton = this.byId("btnMessagePopoverId");
          this.getDialog("MessagePopover").then((oDialog) =>
            setTimeout(() => oDialog.openBy(oButton), 0)
          );
        },
      }
    );
  }
);
