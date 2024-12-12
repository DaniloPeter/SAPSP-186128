sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "com/segezha/form/roll/conversion/model/formatter",
    "com/segezha/form/roll/conversion/model/Utils",
  ],
  (Controller, formatter, Utils) => {
    "use strict";
    return Controller.extend("com.segezha.form.roll.conversion.controller.Base", {
      formatter: formatter,
      utils: Utils,

      getModel(sModel) {
        return this.getOwnerComponent().getModel(sModel);
      },
    });
  }
);
