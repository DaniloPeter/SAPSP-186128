sap.ui.define(
  ["sap/ui/core/mvc/Controller", "../model/formatter"],
  (Controller, formatter) => {
    "use strict";
    return Controller.extend("ui5.testapp.controller.Base", {
      formatter: formatter,
    });
  }
);
