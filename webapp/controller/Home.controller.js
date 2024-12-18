sap.ui.define(
  [
    "com/segezha/form/roll/conversion/controller/Base",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Label",
    "sap/m/SearchField",
    "sap/ui/table/Column",
    "sap/m/Text",
  ],
  (
    BaseController,
    MessageBox,
    MessageToast,
    Label,
    SearchField,
    UIColumn,
    Text
  ) => {
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
        onChangeCommonField(oEvent) {
          const oSource = oEvent.getSource(),
            sBindingValue = oSource.getBinding("value").getPath(),
            oBindingData = oSource.getBindingContext().getObject(),
            oSuggestionBinding = oSource.getBinding("suggestionRows"),
            sValue = oSource.getValue(),
            iMinValue = oSource.getMin && oSource.getMin(),
            isRequired = oSource.getRequired();

          let isFoundSomething = true;
          if (iMinValue !== undefined && isRequired) {
            isFoundSomething = +oBindingData[sBindingValue] > iMinValue;
          }
          if (oSuggestionBinding) {
            const aSuggestionRows = oSource.getSuggestionRows();
            isFoundSomething = aSuggestionRows.some((o) => {
              return o
                .getBindingContext()
                .getPath()
                .includes(`${sBindingValue}='${sValue}'`);
            });
          }

          const hasError = !isFoundSomething;
          this.setStateProperty(`/errorFields/${sBindingValue}`, hasError);
          return hasError;
        },

        onChangeAufnr(oEvent) {
          const oSource = oEvent.getSource(),
            sValue = oSource.getValue(),
            isFullValue = sValue && !sValue.includes("_");
          this.onChangeCommonField(oEvent);

          if (!isFullValue) {
            return;
          }

          const sBindingPath = oSource.getBindingContext().getPath(),
            oModel = this.getModel();
          this.callODataFunction("/GetKlishe", {
            Aufnr: sValue,
          }).then((oResponse) => {
            const { Matnr, Maktx } = oResponse.GetKlishe;
            if (Matnr) {
              oModel.setProperty(`${sBindingPath}/Klishe`, Matnr);
              this.setStateProperty("/errorFields/Klishe", false);
            }
            if (Maktx) {
              oModel.setProperty(`${sBindingPath}/Zklishetext`, Maktx);
            }
          });
        },

        onChangeWpResource(oEvent) {
          const oSource = oEvent.getSource(),
            sValue = oSource.getValue(),
            oBindingContext = oSource.getBindingContext(),
            oBindingData = oBindingContext.getObject(),
            sBindingPath = oBindingContext.getPath(),
            oModel = this.getModel();
          this.onChangeCommonField(oEvent);

          if (!sValue) {
            return;
          }

          this.callODataFunction("/GetTplnr", {
            WpResource: sValue,
            Werks: oBindingData.Werks,
          }).then((oResponse) => {
            const sTplnr = oResponse.TPLNR;
            if (sTplnr) {
              oModel.setProperty(`${sBindingPath}/Tplnr`, sTplnr);
            }
          });
        },
        onChangeRollNum(oEvent) {
          const oSource = oEvent.getSource(),
            oModel = this.getModel(),
            sValue = oSource.getValue(),
            sBindingValue = oSource.getBinding("value").getPath(),
            oBindingContext = oSource.getBindingContext(),
            sBindingPath = oBindingContext.getPath(),
            oBindingData = oBindingContext.getObject(),
            sRollNum = sBindingValue.includes("1") ? "1" : "2";

          this.onChangeCommonField(oEvent);

          if (!sValue) {
            return;
          }

          this.callODataFunction("/GetDataRoll", {
            Werks: oBindingData.Werks,
            Lgort: oBindingData.Lgort,
            RollNum: sValue,
          }).then((oResponse) => {
            const { ValueFrom, Matnr, Charg } = oResponse;
            oModel.setProperty(
              `${sBindingPath}/Zformat${sRollNum}`,
              ValueFrom.replace(",", ".")
            );
            this.setStateProperty(`/rollData/roll${sRollNum}/Material`, Matnr);
            this.setStateProperty(`/rollData/roll${sRollNum}/Charg`, Charg);
          });
        },

        onChangeMetersOrReport(oEvent) {
          const oSource = oEvent.getSource(),
            oBindingContext = oSource.getBindingContext(),
            sBindingPath = oBindingContext.getPath(),
            oModel = this.getModel();
          if (this.onChangeCommonField(oEvent)) {
            oModel.setProperty(`${sBindingPath}/Zstamp`, (0).toFixed(3));
            this.setStateProperty("/errorFields/Zstamp", true);
            return;
          }

          const oBindingData = oBindingContext.getObject(),
            iPrintMeters = +oBindingData.Zpm,
            iReportLength = +oBindingData.Zlengthreport,
            sCalcOverPrints = this.utils.calculateOverPrints(
              iPrintMeters,
              iReportLength
            );

          this.setStateProperty("/errorFields/Zstamp", +sCalcOverPrints <= 0);
          oModel.setProperty(`${sBindingPath}/Zstamp`, sCalcOverPrints);
        },

        onChangeZwaste(oEvent) {
          const oSource = oEvent.getSource(),
            iValue = +oSource.getValue(),
            bSelectedDefect = this.getStateProperty("/switches/defect");
          if (iValue > 50 && !bSelectedDefect) {
            this.setStateProperty("/switches/defect", true);
            this._addEmptyRow("/tables/defect/items", 4, true);
          }
        },

        onChangeDownTime(oEvent) {
          const oSource = oEvent.getSource(),
            oBindingContext = oSource.getBindingContext("state"),
            oItem = oBindingContext.getObject(),
            sItemPath = oBindingContext.getPath();
          const iCalcDownTime = this.utils.calculateDownTime(
            oItem.Auztv,
            oItem.Auztb
          );

          this.setStateProperty(
            `${sItemPath}/Zdownhours_error`,
            !iCalcDownTime
          );
          this.setStateProperty(`${sItemPath}/Zdownhours`, iCalcDownTime);
        },

        onSwitch(oEvent, sType) {
          const bSelected = oEvent.getParameter("state");
          if (!bSelected) {
            return;
          }

          switch (sType) {
            case "defect":
              this._addEmptyRow("/tables/defect/items", 4, true);
              break;
            case "downTime":
              this._addEmptyRow("/tables/downTime/items", 3, true);
          }
        },

        onAddRow(oEvent, sType) {
          switch (sType) {
            case "defect":
              this._addEmptyRow("/tables/defect/items", 4);
              break;
            case "downTime":
              this._addEmptyRow("/tables/downTime/items");
          }
        },

        onRemoveRow(oEvent, sType) {
          const oSource = oEvent.getSource(),
            oTable = oSource.getParent().getParent(),
            aSelectedContexts = oTable.getSelectedContextPaths();

          if (!aSelectedContexts.length) {
            MessageToast.show("Выберите позиции для удаления.");
            return;
          }

          const aSelectedIndexes = aSelectedContexts.map((sPath) => {
            const aSplittedPath = sPath.split("/");
            return +aSplittedPath[aSplittedPath.length - 1];
          });

          oTable.removeSelections();

          switch (sType) {
            case "defect":
              this._removeRows("/tables/defect/items", aSelectedIndexes);
              break;
            case "downTime":
              this._removeRows("/tables/downTime/items", aSelectedIndexes);
          }
        },

        _addEmptyRow(sBindingTable, iLimit = 3, bAutoAdd = false) {
          const aTablePositions = this.getStateProperty(sBindingTable);
          if (bAutoAdd) {
            if (!aTablePositions.length) {
              this.setStateProperty(sBindingTable, [{}]);
            }
            return;
          }
          if (aTablePositions.length >= iLimit) {
            MessageToast.show(`Нельзя добавить более ${iLimit} позиций.`);
            return;
          }
          this.setStateProperty(sBindingTable, [...aTablePositions, {}]);
        },

        _removeRows(sBindingTable, aSelectedIndexes) {
          let aTablePositions = this.getStateProperty(sBindingTable);
          aTablePositions = aTablePositions.filter(
            (_, index) => !aSelectedIndexes.includes(index)
          );
          this.setStateProperty(sBindingTable, aTablePositions);
        },

        onVHDownTimeRequested(oEvent) {
          const oSource = oEvent.getSource(),
            oSuggestionBinding = oSource.getBinding("suggestionRows"),
            sSuggestionPath = oSuggestionBinding.getPath(),
            aSuggestionFields = oSuggestionBinding.oEntityType.property;

          this._oInputVH = oSource;
          this._oBasicSearchField = new SearchField();
          this.getDialog("VHDownTime").then((oDialog) => {
            const oFilterBar = oDialog.getFilterBar();

            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(this._oBasicSearchField);

            this._oBasicSearchField.attachSearch(function () {
              oFilterBar.search();
            });

            oDialog.getTableAsync().then((oTable) => {
              if (oTable.getBinding("rows")) {
                return;
              }
              if (oTable.bindRows) {
                oTable.bindAggregation("rows", {
                  path: sSuggestionPath,
                  events: {
                    dataReceived: function () {
                      oDialog.update();
                    },
                  },
                });
                aSuggestionFields.forEach((oField) => {
                  const tempLabel =
                    oField.extensions.find((e) => e.name === "label")?.value ||
                    oField.name;
                  oTable.addColumn(
                    new UIColumn({
                      label: new Label({
                        text: tempLabel,
                      }),
                      template: new Text({
                        wrapping: false,
                        text: `{${oField.name}}`,
                      }),
                    })
                  );
                });
              }
              oDialog.update();
            });
            oDialog.open();
          });
        },

        onValueHelpOkPress(oEvent) {
          const aTokens = oEvent.getParameter("tokens");
          if (!aTokens.length || !this._oInputVH) {
            return;
          }
          const oTokenData = aTokens[0].data("row"),
            oItemContext = this._oInputVH.getBindingContext("state"),
            sItemPath = oItemContext.getPath();

          this.setStateProperty(`${sItemPath}/Kurztext`, oTokenData.Kurztext);
          this.setStateProperty(`${sItemPath}/Qmgrp`, oTokenData.Qmgrp);
          this.setStateProperty(`${sItemPath}/Qmcod`, oTokenData.Qmcod);

          oEvent.getSource().close();
        },

        onValueHelpCancelPress(oEvent) {
          oEvent.getSource().close();
        },

        onConfirmFormData() {
          const oBindingData = this.getView().getBindingContext().getObject(),
            aTableData = this.getStateProperty("/tables"),
            aDefects = aTableData.defect.items,
            aDownTimes = aTableData.downTime.items,
            hasError = this._validateFields({
              formData: oBindingData,
              defects: aDefects,
              downTimes: aDownTimes,
            });

          if (hasError) {
            MessageBox.error(
              "Исправьте ошибки в форме и заполните обязательные поля."
            );
            return;
          }
          const aIgnoredFields = [
              "__metadata",
              "Idconvroll",
              "toDefect",
              "toDowntime",
            ],
            oSwitches = this.getStateProperty("/switches"),
            oFormData = Object.entries(oBindingData)
              .filter(([key]) => !aIgnoredFields.includes(key))
              .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

          if (oSwitches.defect) {
            oFormData.toDefect = aDefects;
          }
          if (oSwitches.downTime) {
            oFormData.toDowntime = aDownTimes.map((o) => {
              return Object.entries(o).reduce((acc, [key, value]) => {
                acc[key] = value;
                if (value.getDate) {
                  acc[key] = this.utils.fromDateToEdmTime(value);
                }
                return acc;
              }, {});
            });
          }
          this.sendData("/OPER_CONV_ROOLSet", oFormData);
        },

        _validateFields(oParams) {
          const aRequiredFields = this.getStateProperty("/requiredFields"),
            oModel = this.getModel(),
            aMetaFields =
              oModel.oMetadata._getEntityTypeByPath(
                "/OPER_CONV_ROOLSet"
              ).property;
          let hasError = false;

          const fnPushErrorField = (sField) => {
            this.setStateProperty(`/errorFields/${sField}`, true);
            hasError = true;
          };

          aRequiredFields.forEach((sField) => {
            const fieldValue = oParams.formData[sField],
              foundMetaField = aMetaFields.find((o) => o.name === sField),
              foundFromErrors = this.getStateProperty(`/errorFields/${sField}`);
            if (foundFromErrors) {
              fnPushErrorField(sField);
            }
            switch (foundMetaField.type) {
              case "Edm.String":
                if (!fieldValue) {
                  fnPushErrorField(sField);
                }
                break;
              case "Edm.DateTime":
                if (!fieldValue) {
                  fnPushErrorField(sField);
                }
                break;
              case "Edm.Decimal":
                if (!+fieldValue) {
                  fnPushErrorField(sField);
                }
                break;
              default:
                if (!fieldValue) {
                  fnPushErrorField(sField);
                }
                break;
            }
          });
          return hasError;
        },
      }
    );
  }
);
