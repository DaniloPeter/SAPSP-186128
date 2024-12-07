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

      handleChangeMetersOrReport: function (oEvent) {
        const oSource = oEvent.getSource(),
          sValue = oSource.getValue(),
          sFieldPath = oSource.getBinding("value").getPath(),
          oDataModel = this.getModel("data");

        //TODO: эта функция необходима, чтобы получить реально значение
        //Потому что в момент срабатывания, там будет предыдущее значение, можешь это посмотреть
        //Поэтому вытягиваем реальное значение, а для другого поля берем его из модели
        const fnGetRealValue = (sPath) => {
          return sFieldPath.includes(sPath)
            ? +sValue
            : +oDataModel.getProperty(sPath);
        };

        const iPrintMeters = fnGetRealValue("/printMeters"),
          iReportLength = fnGetRealValue("/reportLength"),
          iCalcOverPrints = this.utils.calculateOverPrints(
            iPrintMeters,
            iReportLength
          );

        oDataModel.setProperty("/overPrints", iCalcOverPrints);
      },

      handleChangeDisruptWeight: function (oEvent) {
        const oSource = oEvent.getSource(),
          iValue = +oSource.getValue(),
          oDataModel = this.getModel("data"),
          bSelectedDefect = oDataModel.getProperty("/switch/defect");
        //TODO: при изменении веса срыва, если значение больше 50, то включаем свитч брака
        if (iValue > 50 && !bSelectedDefect) {
          oDataModel.setProperty("/switch/defect", true);
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
