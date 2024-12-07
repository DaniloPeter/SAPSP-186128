sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/BindingMode",
  ],
  (UIComponent, JSONModel, BindingMode) => {
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
          overPrints: 0,
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
        //TODO: эта строчка необходима, что при изменении значения в инпуте, менялось значение не только на экране, но и в модели автоматически
        // Чтобы работала корректно функция handleChangeMetersOrReport
        oModel.setDefaultBindingMode(BindingMode.TwoWay);
        this.setModel(oModel, "data");

        this.getRouter().initialize();
      },
    });
  }
);
