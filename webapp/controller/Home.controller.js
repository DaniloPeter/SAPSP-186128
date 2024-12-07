sap.ui.define(
  [
    "ui5/testapp/controller/Base",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
  ],
  (BaseController, MessageToast, Filter, FilterOperator) => {
    "use strict";
    return BaseController.extend("ui5.testapp.controller.Home", {
      onInit() {
        const currentDate = new Date();
        this.getView().byId("dateTimePicker").setDateValue(currentDate);
      },

      handleAddBrak() {
        const oStateModel = this.getOwnerComponent().getModel("state"),
          aBraks = oStateModel.getProperty("/braks/items");
        aBraks.push({
          defect: 2,
          comment: "",
        });
        oStateModel.setProperty("/braks/items", aBraks);
      },

      handleAddDowntime() {
        const oStateModel = this.getOwnerComponent().getModel("state"),
          aDownTimes = oStateModel.getProperty("/table/items");
        if (aDownTimes.length >= 3) {
          MessageToast.show("Нельзя добавить более 3 простоев.");
          return;
        }
        aDownTimes.push({});
        oStateModel.setProperty("/table/items", aDownTimes);
      },
    });
  }
);
