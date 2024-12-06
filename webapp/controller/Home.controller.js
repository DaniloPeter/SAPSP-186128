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

      onSwitchChange(oEvent) {
        const newState = oEvent.getParameter("state");
        const sId = oEvent.getParameter("id");
        const oModel = this.getView().getModel("data");

        if (sId.includes("downTime"))
          oModel.setProperty("/switch/downTime", newState);
        if (sId.includes("defect"))
          oModel.setProperty("/switch/defect", newState);
      },

      onDisruptWeightChange(oEvent) {
        const newValue = oEvent.getParameter("value");
        const oModel = this.getView().getModel("data");
        const defectSwitch = this.getView().byId("defectSwitch");

        if (newValue && parseFloat(newValue) > 50) {
          oModel.setProperty("/switch/defect", true);
          defectSwitch.setState(true);
        } else {
          oModel.setProperty("/switch/defect", false);
          defectSwitch.setState(false);
        }
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
