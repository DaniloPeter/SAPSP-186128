sap.ui.define(
  ["sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel"],
  (UIComponent, JSONModel) => {
    "use strict";

    return UIComponent.extend("ui5.testapp.Component", {
      metadata: {
        interfaces: ["sap.ui.core.IAsyncContentCreation"],
        manifest: "json",
      },

      init() {
        UIComponent.prototype.init.apply(this, arguments);

        const oData = {
          switch: {
            downTime: false,
            defect: false,
          },
          reportLength: 0,
          disruptWeight: 0,
          printMeters: 0,
          line: 5,
          order: 2,
          engineer: 3,
          downTime: 1,
          shift: 1,
          crew: 2,
          defect: 4,
          resource: 5,
        };

        const oModel = new JSONModel(oData);
        this.setModel(oModel, "data");

        this.getRouter().initialize();
      },
    });
  }
);
