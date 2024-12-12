sap.ui.define(
  ["com/segezha/form/roll/conversion/controller/Base", "sap/m/MessageToast"],
  (BaseController, MessageToast) => {
    "use strict";
    return BaseController.extend(
      "com.segezha.form.roll.conversion.controller.Home",
      {
        onInit() {},

        handleChange: function (oEvent) {
          const oSource = oEvent.getSource(),
            oStateModel = this.getModel("state"),
            sValue = oSource.getValue(),
            aSuggestionRows = oSource.getSuggestionRows(),
            aSuggestionData = aSuggestionRows.map((o) =>
              o.getBindingContext().getObject()
            ),
            isFoundSomething = aSuggestionData.some((o) => {
              return Object.entries(o).some(([sFieldKey, sFieldValue]) => {
                if (sFieldKey === "__metadata") {
                  return false;
                }
                return sFieldValue.toString().includes(sValue);
              });
            });

          oStateModel.setProperty(`/MaterialError`, !isFoundSomething);
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

        handleChangeDownTime: function (oEvent) {
          const oSource = oEvent.getSource(),
            oStateModel = this.getModel("state"),
            //Если элемент имеет binding (bindElement или это элемент таблицы)
            //То мы можем получим его, в скобках указываем привязанную модель
            oBindingContext = oSource.getBindingContext("state"),
            oItem = oBindingContext.getObject(), //Получаем объект bindinga из модели
            sItemPath = oBindingContext.getPath(); // Получаем путь bindinga, чтобы перезаписать новое значение
          // Метод для рассчета времени простоя в utils, возвращает строку,
          // можно вернуть объект Date(но зачем)
          const iCalcDownTime = this.utils.calculateDownTime(
            oItem.dateBegin,
            oItem.dateEnd
          );
          oStateModel.setProperty(`${sItemPath}/downTime`, iCalcDownTime);
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
      }
    );
  }
);
