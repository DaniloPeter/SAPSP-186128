sap.ui.define(
  [
    "com/segezha/form/roll/conversion/controller/Base",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
  ],
  (BaseController, MessageBox, MessageToast, Filter) => {
    "use strict";
    return BaseController.extend(
      "com.segezha.form.roll.conversion.controller.Home",
      {
        onInit() {
          const oModel = this.getModel();
          oModel.metadataLoaded().then(() => {
            const sPath = oModel.createKey("/OPER_CONV_ROOLSet", {
              Idconvroll: "",
            });
            this.getView().bindElement({
              path: sPath,
            });
          });
        },
        handleChange(oEvent) {
          const oSource = oEvent.getSource(),
            isRequired = oSource.getRequired();
          if (!isRequired) {
            return;
          }
          const sBindingValue = oSource.getBinding("value").getPath(),
            oSuggestionBinding = oSource.getBinding("suggestionRows"),
            sValue = oSource.getValue();
          let isFoundSomething = !!sValue.length;
          if (oSuggestionBinding) {
            const aSuggestionRows = oSource.getSuggestionRows();
            isFoundSomething = aSuggestionRows.some((o) => {
              return o
                .getBindingContextPath()
                .includes(`${sBindingValue}='${sValue}'`);
            });
          }
          this.setStateProperty(
            `/errorFields/${sBindingValue}`,
            !isFoundSomething
          );
        },

        handleChangeAufnr(oEvent) {
          const oSource = oEvent.getSource(),
            sValue = oSource.getValue(),
            iMaxLength = oSource.getMaxLength();
          this.handleChange(oEvent);

          if (sValue.length === iMaxLength) {
            const sBindingPath = oSource.getBindingContextPath(),
              oModel = this.getModel();
            this.callODataFunction("/GetKlishe", {
              Aufnr: sValue,
            }).then((oResponse) => {
              const { Matnr, Maktx } = oResponse.GetKlishe;
              oModel.setProperty(`${sBindingPath}/Klishe`, Matnr);
              oModel.setProperty(`${sBindingPath}/Zklishetext`, Maktx);
            });
          }
        },

        handleChangeResource(oEvent) {
          const oSource = oEvent.getSource(),
            sValue = oSource.getValue(),
            iMaxLength = oSource.getMaxLength();
          this.handleChange(oEvent);

          if (sValue.length === iMaxLength) {
            this.callODataFunction("/GetTplnr", {
              WpResource: sValue,
              Werks: "1234",
            }).then((oResponse) => {});
          }
        },

        handleChangeTechNumber(oEvent) {
          const oSource = oEvent.getSource(),
            sValue = oSource.getValue(),
            iMaxLength = oSource.getMaxLength();
          this.handleChange(oEvent);

          if (sValue.length === iMaxLength) {
            this.callODataFunction("/CheckAufnr", {
              Aufnr: sValue,
            })
              .then((oResponse) => {
                const sDocNumber = oResponse.CheckAufnr.Documentnumber;
                if (!sDocNumber) {
                  MessageBox.error(oResponse.CheckAufnr.Message);
                  return;
                }
              })
              .catch((oError) => {
                MessageBox.error(
                  JSON.parse(oError.responseText).error.message.value
                );
              });
          }
        },
        handleChangeMetersOrReport(oEvent) {
          const oSource = oEvent.getSource(),
            sValue = oSource.getValue(),
            sFieldPath = oSource.getBinding("value").getPath(),
            oBindingContext = oSource.getBindingContext(),
            oBindingData = oBindingContext.getObject(),
            sBindingPath = oBindingContext.getPath(),
            oModel = this.getModel();

          const fnGetRealValue = (sPath) =>
            sFieldPath.includes(sPath) ? +sValue : +oBindingData[sPath];

          const iPrintMeters = fnGetRealValue("Zpm"),
            iReportLength = fnGetRealValue("Zlengthreport"),
            iCalcOverPrints = this.utils.calculateOverPrints(
              iPrintMeters,
              iReportLength
            );

          oModel.setProperty(`${sBindingPath}/Zstamp`, iCalcOverPrints);
        },

        handleChangeZwaste(oEvent) {
          const oSource = oEvent.getSource(),
            iValue = +oSource.getValue(),
            bSelectedDefect = this.getStateProperty("/switches/defect");
          if (iValue > 50 && !bSelectedDefect) {
            this.setStateProperty("/switches/defect", true);
          }
        },

        handleChangeDownTime(oEvent) {
          const oSource = oEvent.getSource(),
            oBindingContext = oSource.getBindingContext("state"),
            oItem = oBindingContext.getObject(),
            sItemPath = oBindingContext.getPath();
          const iCalcDownTime = this.utils.calculateDownTime(
            oItem.Auztv,
            oItem.Auztb
          );
          this.setStateProperty(`${sItemPath}/Zdownhours`, iCalcDownTime);
        },

        handleAddDefect() {
          const sBindingTable = "/tables/defect/items",
            aDefects = this.getStateProperty(sBindingTable);
          if (aDefects.length >= 4) {
            MessageToast.show("Нельзя добавить более 4 дефектов.");
            return;
          }
          this.setStateProperty(sBindingTable, [...aDefects, {}]);
        },

        handleAddDowntime() {
          const sBindingTable = "/tables/downTime/items",
            aDownTimes = this.getStateProperty(sBindingTable);
          if (aDownTimes.length >= 3) {
            MessageToast.show("Нельзя добавить более 3 простоев.");
            return;
          }
          this.setStateProperty(sBindingTable, [...aDownTimes, {}]);
        },

        handleConfirmFormData() {
          const oBindingData = this.getView().getBindingContext().getObject(),
            aTableData = this.getStateProperty("/tables"),
            aDefects = aTableData.defect.items,
            aDownTimes = aTableData.downTime.items,
            aIgnoredFields = [
              "__metadata",
              "Idconvroll",
              "toDefect",
              "toDowntime",
            ],
            oFormData = Object.entries(oBindingData)
              .filter(([key]) => !aIgnoredFields.includes(key))
              .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
          oFormData.toDefect = aDefects;
          oFormData.toDowntime = aDownTimes.map((o) => {
            return Object.entries(o).reduce((acc, [key, value]) => {
              acc[key] = value;
              if (value.getDate) {
                acc[key] = this.utils.fromDateToEdmTime(value);
              }
              return acc;
            }, {});
          });
          this.sendData("/OPER_CONV_ROOLSet", oFormData);
        },
      }
    );
  }
);
