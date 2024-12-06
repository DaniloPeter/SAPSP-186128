sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
  ],
  (Controller) => {
    "use strict";
    return Controller.extend("ui5.testapp.controller.App", {
      onInit: function () {
        const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("home");
      },
    });
  }
);
