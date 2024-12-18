sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "com/segezha/form/roll/conversion/model/formatter",
    "com/segezha/form/roll/conversion/model/Utils",
  ],
  (Controller, Fragment, formatter, Utils) => {
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
      }
    );
  }
);
