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
          this.__bindView();
        },

        __bindView() {
          const oModel = this.getModel(),
            oView = this.getView();
          oModel.metadataLoaded().then(() => {
            const sPath = oModel.createKey("/OPER_CONV_ROOLSet", {
              Idconvroll: "10",
            });
            if (oView.getBindingContext()) {
              this.readOData(sPath).then((oResponse) => {
                Object.entries(oResponse).forEach(([key, value]) => {
                  oModel.setProperty(`${sPath}/${key}`, value);
                });
              });
              return;
            }
            oView.bindElement({
              path: sPath,
            });
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

        onChangeLgort(oEvent) {
          const oSource = oEvent.getSource(),
            sValue = oSource.getValue();

          this.onChangeCommonField(oEvent);

          if (!sValue) {
            return;
          }

          this.__getDataRoll();
        },

        onChangeAufnr(oEvent) {
          const oSource = oEvent.getSource(),
            sValue = oSource.getValue(),
            isFullValue = sValue && !sValue.includes("_");

          if (!isFullValue) {
            this.setStateProperty("/errorFields/Aufnr", true);
            return;
          }

          this.setStateProperty("/errorFields/Aufnr", false);

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
        onChangeZnewformat(oEvent) {
          const oSource = oEvent.getSource(),
            sValue = oSource.getValue(),
            iValue = this.utils.stringToNumber(sValue),
            oView = this.getView(),
            oBindingContext = oView.getBindingContext(),
            oBindingData = oBindingContext.getObject(),
            iFormat1 = this.utils.stringToNumber(oBindingData.Zformat1),
            iFormat2 = this.utils.stringToNumber(oBindingData.Zformat2),
            iSumFormat = iFormat1 + iFormat2;

          if (iValue > iSumFormat) {
            MessageBox.error(
              `Формат запечатанного рулона не должен превышать сумму форматов исходного рулона.`
            );
            this.setStateProperty("/errorFields/Znewformat", true);
            return;
          }

          this.onChangeCommonField(oEvent);
        },

        onChangeRollNum(oEvent) {
          const oSource = oEvent.getSource(),
            sValue = oSource.getValue(),
            sBindingValue = oSource.getBinding("value").getPath(),
            sRollNum = sBindingValue.includes("1") ? "1" : "2";

          this.onChangeCommonField(oEvent);

          if (!sValue) {
            return;
          }

          this.__getDataRoll(sValue, sRollNum);
        },

        __getDataRoll(sRollValue, sRollNum) {
          const oModel = this.getModel(),
            oView = this.getView(),
            oBindingContext = oView.getBindingContext(),
            sBindingPath = oBindingContext.getPath(),
            oBindingData = oBindingContext.getObject(),
            { Werks, Lgort } = oBindingData;

          if (!Werks || !Lgort) {
            return;
          }

          const fnSetValuesByIndex = (oValues, index) => {
            const { ValueFrom, Matnr, Charg } = oValues;
            const formattedValue = this.utils.formatStringValueFrom(ValueFrom);
            if (formattedValue) {
              oModel.setProperty(
                `${sBindingPath}/Zformat${index}`,
                formattedValue
              );
            }
            this.setStateProperty(`/rollData/roll${index}/Material`, Matnr);
            this.setStateProperty(`/rollData/roll${index}/Charg`, Charg);
          };

          const fnCallBackend = (value, number) => {
            this.callODataFunction("/GetDataRoll", {
              Werks: Werks,
              Lgort: Lgort,
              RollNum: value,
            }).then((oResponse) => {
              if (number) {
                fnSetValuesByIndex(oResponse, number);
                return;
              }
              fnSetValuesByIndex(oResponse, 1);
              fnSetValuesByIndex(oResponse, 2);
            });
          };

          if (sRollNum) {
            fnCallBackend(sRollValue, sRollNum);
            return;
          }

          const sRollValue1 = oBindingData.RollNum1,
            sRollValue2 = oBindingData.RollNum2;

          if (sRollValue1 && sRollValue1 !== sRollValue2) {
            fnCallBackend(sRollValue1, 1);
          }
          if (sRollValue2 && sRollValue1 !== sRollValue2) {
            fnCallBackend(sRollValue2, 2);
          }
          if (sRollValue1 && sRollValue2 && sRollValue1 === sRollValue2) {
            fnCallBackend(sRollValue1);
          }
        },

        onChangeMetersOrReport(oEvent) {
          const oSource = oEvent.getSource(),
            oBindingContext = oSource.getBindingContext(),
            sBindingPath = oBindingContext.getPath(),
            oModel = this.getModel();
          if (this.onChangeCommonField(oEvent)) {
            oModel.setProperty(
              `${sBindingPath}/Zstamp`,
              this.utils.zeroString()
            );
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

          this.onChangeCommonField(oEvent);

          const iCalcDownTime = this.utils.calculateDownTime(
              oItem.Auztv,
              oItem.Auztb
            ),
            isError = !iCalcDownTime;

          if (isError && oItem.Auztb) {
            MessageBox.error(
              "Введите время начала простоя, не превышающее время окончания."
            );
          }
          this.setStateProperty(`${sItemPath}/Zdownhours_error`, isError);
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
          this.setStateProperty(`${sItemPath}/Kurztext_error`, false);
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
            oSwitches = this.getStateProperty("/switches"),
            oDefects = aTableData.defect,
            oDownTimes = aTableData.downTime,
            hasError = this.__validateFields({
              formData: oBindingData,
              defects: oDefects,
              downTimes: oDownTimes,
              switches: oSwitches,
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
            oFormData = Object.entries(oBindingData)
              .filter(([key]) => !aIgnoredFields.includes(key))
              .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

          if (oSwitches.defect) {
            oFormData.toDefect = this.__mappingStructrePositions(oDefects);
          }
          if (oSwitches.downTime) {
            oFormData.toDowntime = this.__mappingStructrePositions(oDownTimes);
          }
          this.sendData("/OPER_CONV_ROOLSet", oFormData).then(() => {
            this.__bindView();
            this.__clearStatesFields();
            MessageBox.success("Форма успешно отправлена.");
          });
        },

        __validateFields(oParams) {
          const aRequiredFields = this.getStateProperty("/requiredFields"),
            oModel = this.getModel(),
            aMetaFields =
              oModel.oMetadata._getEntityTypeByPath(
                "/OPER_CONV_ROOLSet"
              ).property;
          let hasError = false;

          const fnCheckFormData = () => {
            const fnPushErrorField = (sField) => {
              this.setStateProperty(`/errorFields/${sField}`, true);
              hasError = true;
            };

            aRequiredFields.forEach((sField) => {
              const fieldValue = oParams.formData[sField],
                foundMetaField = aMetaFields.find((o) => o.name === sField),
                foundFromErrors = this.getStateProperty(
                  `/errorFields/${sField}`
                );
              if (foundFromErrors) {
                fnPushErrorField(sField);
              }
              switch (foundMetaField?.type) {
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
          };

          const fnCheckPositions = (oEntryPosition) => {
            const { path, items, requiredFields } = oEntryPosition;
            const fnPushErrorField = (sFieldPath) => {
              this.setStateProperty(`${sFieldPath}_error`, true);
              hasError = true;
            };

            if (!items.length) {
              hasError = true;
              return;
            }

            items.forEach((oItem, index) => {
              requiredFields.forEach((sField) => {
                const foundFromErrors = oItem[`${sField}_error`];
                if (!oItem[sField] || foundFromErrors) {
                  fnPushErrorField(`${path}/${index}/${sField}`);
                }
              });
            });
          };

          fnCheckFormData();

          if (oParams.switches.defect) {
            fnCheckPositions(oParams.defects);
          }

          if (oParams.switches.downTime) {
            fnCheckPositions(oParams.downTimes);
          }
          return hasError;
        },

        __mappingStructrePositions(oEntryPosition) {
          const { items } = oEntryPosition;
          return items.map((o) => {
            return Object.entries(o).reduce((acc, [key, value]) => {
              if (key.includes("error")) {
                return acc;
              }
              acc[key] = value;
              if (value.getDate) {
                acc[key] = this.utils.fromDateToEdmTime(value);
              }
              return acc;
            }, {});
          });
        },

        __clearStatesFields() {
          this.setStateProperty("/errorFields", {});
          this.setStateProperty("/tables/defect/items", []);
          this.setStateProperty("/tables/downTime/items", []);
          this.setStateProperty("/switches", {
            defect: false,
            downTime: false,
          });
          this.setStateProperty("/rollData/roll1", {});
          this.setStateProperty("/rollData/roll2", {});
        },
      }
    );
  }
);
