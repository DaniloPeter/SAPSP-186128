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
          inputWork: 1234,
          resource: 5,
          store: 5,
          printMode: 2,
          dateTime: new Date(),
          shift: 1,
          crew: 2,
          techNumber: null,
          cliche: "1234A",
          clicheDescription: null,
          machineSpeed: null,
          printName: null,
          engineer: 3,
          rollNumberOne: null,
          origRollFormatOne: "123 auto",
          remainNumberOne: null,
          rollNumberTwo: null,
          origRollFormatTwo: "123 auto",
          remainNumberTwo: null,
          printRollFormat: null,
          printMeters: 0,
          reportLength: 0,
          overPrints: 0,
          rollDiameter: null,
          disruptWeight: 0,
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
