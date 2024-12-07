sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "ui5/testapp/model/formatter",
    "ui5/testapp/model/Utils",
  ],
  (Controller, formatter, Utils) => {
    "use strict";
    return Controller.extend("ui5.testapp.controller.Base", {
      formatter: formatter,
      utils: Utils,

      getModel(sModel) {
        return this.getOwnerComponent().getModel(sModel);
      },
    });
  }
);
