sap.ui.define(
  [
    "com/segezha/form/roll/conversion/controller/Base",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Label",
    "sap/m/SearchField",
    "sap/ui/table/Column",
    "sap/m/Text",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  (
    BaseController,
    MessageBox,
    MessageToast,
    Label,
    SearchField,
    UIColumn,
    Text,
    Filter,
    FilterOperator,
    library
  ) => {
    "use strict";

    return BaseController.extend(
      "com.segezha.form.roll.conversion.controller.Home",
      {
        onInit() {
          this.__bindView();

          const oMessageManager = sap.ui.getCore().getMessageManager(),
            oView = this.getView();
          oMessageManager.getMessageModel().setDefaultBindingMode("TwoWay");
          oView.setModel(oMessageManager.getMessageModel(), "message");

          oMessageManager.registerObject(oView, true);
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
          this.onChangeCommonField(oSource);

          if (!sValue) {
            return;
          }

          const oPayload = {
            WpResource: sValue,
            Werks: oBindingData.Werks,
          };

          this.callODataFunction("/GetTplnr", oPayload).then((oResponse) => {
            const { TPLNR } = oResponse.TPLNR;
            if (TPLNR) {
              oModel.setProperty(`${sBindingPath}/Tplnr`, TPLNR);
            }
          });

          this.readOData("/BRIGSet", {
            filters: [
              new Filter("WpResource", FilterOperator.EQ, sValue),
              new Filter("Werks", FilterOperator.EQ, oBindingData.Werks),
            ],
          }).then((oResponse) => {
            this.setStateProperty("/valueHelps/BRIGSet", oResponse.results);
          });
        },

        onChangeWpOperatingmode(oEvent) {
          const oSource = oEvent.getSource(),
            oModel = this.getModel(),
            sSelectedKey = oSource.getSelectedKey(),
            sBindingPath = oSource.getBindingContext().getPath();
          this.onChangeCommonField(oSource);

          if (sSelectedKey === "1141" || sSelectedKey === "1142") {
            this.setStateProperty("/switches/roll", false);
            this.setStateProperty("/switches/rollEnabled", false);
            oModel.setProperty(`${sBindingPath}/RollNum2`, "");
            oModel.setProperty(
              `${sBindingPath}/Zformat2`,
              this.utils.zeroString(3)
            );
            oModel.setProperty(
              `${sBindingPath}/Zradius2`,
              this.utils.zeroString(0)
            );
            return;
          }
          this.setStateProperty("/switches/rollEnabled", true);
        },

        onChangeZprinter(oEvent) {
          var oSource = oEvent.getSource(),
            sValue = oSource.getValue(),
            sFilteredValue = sValue.replace(/[^а-яА-ЯёЁ\s]/g, "");

          if (sValue !== sFilteredValue) {
            oSource.setValue(sFilteredValue);
            if (!sFilteredValue) {
              this.setStateProperty("/errorFields/Zprinter", true);
            }
            return;
          }

          this.onChangeCommonField(oSource);
          this.setStateProperty("/errorFields/Zprinter", false);
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

          this.onChangeCommonField(oSource);

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

        onSuggestionZloginSelected(oEvent) {
          const oSelectedRowBinding = oEvent
              .getParameter("selectedRow")
              .getBindingContext()
              .getObject(),
            sBindingPath = oEvent.getSource().getBindingContext().getPath(),
            oModel = this.getModel();
          oModel.setProperty(
            `${sBindingPath}/Zlogin`,
            oSelectedRowBinding.Zlogin
          );
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
            bSelected = this.getStateProperty("/switches/roll");

          const fnPushErrorField = (iNumber) => {
            MessageBox.error(
              `Формат запечатанного рулона не должен превышать формат исходного рулона ${iNumber}.`
            );
            this.setStateProperty("/errorFields/Znewformat", true);
          };
          if (iValue > iFormat1) {
            fnPushErrorField(1);
            return;
          }
          if (iValue > iFormat2 && bSelected) {
            fnPushErrorField(2);
            return;
          }

          this.onChangeCommonField(oSource);
        },

        onChangeRollNum(oEvent) {
          const oSource = oEvent.getSource(),
            sValue = oSource.getValue(),
            sBindingValue = oSource.getBinding("value").getPath(),
            sRollNum = sBindingValue.includes("1") ? "1" : "2";

          this.onChangeCommonField(oSource);

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
              this.setStateProperty(`/errorFields/Zformat${index}`, false);
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
          if (this.onChangeCommonField(oSource)) {
            oModel.setProperty(
              `${sBindingPath}/Zstamp`,
              this.utils.zeroString(0)
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
            ),
            isError = sCalcOverPrints.length > 3 || +sCalcOverPrints <= 0;

          this.setStateProperty("/errorFields/Zstamp", isError);
          oModel.setProperty(`${sBindingPath}/Zstamp`, sCalcOverPrints);
        },

        onChangeZflexdiameter(oEvent) {
          const oSource = oEvent.getSource(),
            iValue = this.utils.stringToNumber(oSource.getValue());

          if (this.onChangeCommonField(oSource)) {
            return;
          }

          if (iValue < 10) {
            this.setStateProperty("/errorFields/Zflexdiameter", true);
          }
        },

        onChangeZwaste(oEvent) {
          const oSource = oEvent.getSource(),
            iValue = this.utils.stringToNumber(oSource.getValue()),
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

          this.onChangeCommonField(oSource);

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
          switch (sType) {
            case "defect":
              bSelected && this._addEmptyRow("/tables/defect/items", 4, true);
              break;
            case "downTime":
              bSelected && this._addEmptyRow("/tables/downTime/items", 3, true);
              break;
            case "roll":
              if (!bSelected) {
                const oModel = this.getModel(),
                  sBindingPath = oEvent
                    .getSource()
                    .getBindingContext()
                    .getPath();
                oModel.setProperty(`${sBindingPath}/RollNum2`, "");
                oModel.setProperty(
                  `${sBindingPath}/Zformat2`,
                  this.utils.zeroString()
                );
                oModel.setProperty(
                  `${sBindingPath}/Zradius2`,
                  this.utils.zeroString(1)
                );
                this.setStateProperty(`/errorFields/RollNum2`, false);
                this.setStateProperty(`/errorFields/Zformat2`, false);
                this.setStateProperty(`/errorFields/Zradius2`, false);
              }
              break;
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
                aSuggestionFields.forEach((oField, index) => {
                  const tempLabel =
                      oField.extensions.find((e) => e.name === "label")
                        ?.value || oField.name,
                    tempColumn = new UIColumn({
                      label: new Label({
                        text: tempLabel,
                      }),
                      template: new Text({
                        wrapping: false,
                        text: `{${oField.name}}`,
                      }),
                    });

                  if (index === 3) {
                    tempColumn.setWidth("350px");
                  }
                  oTable.addColumn(tempColumn);
                });

                oTable.bindAggregation("rows", {
                  path: sSuggestionPath,
                  events: {
                    dataReceived: function () {
                      oDialog.update();
                    },
                  },
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

          this.onChangeCommonField(this._oInputVH);

          oEvent.getSource().close();
        },

        onValueHelpCancelPress(oEvent) {
          oEvent.getSource().close();
        },

        onConfirmFormData() {
          const oModel = this.getModel(),
            oBindingData = this.getView().getBindingContext().getObject(),
            aTableData = this.getStateProperty("/tables"),
            oSwitches = this.getStateProperty("/switches"),
            oDefects = aTableData.defect,
            oDownTimes = aTableData.downTime,
            hasError = this.__validateFields(),
            sEntity = "/OPER_CONV_ROOLSet";

          if (hasError) {
            this.onMessagePopoverPress();
            return;
          }
          const aIgnoredFields = [
              "__metadata",
              "Idconvroll",
              "Zfullnameqa",
              "toDefect",
              "toDowntime",
            ],
            aMetaFields =
              oModel.oMetadata._getEntityTypeByPath(sEntity).property,
            oFormData = Object.entries(oBindingData)
              .filter(([key]) => !aIgnoredFields.includes(key))
              .reduce((acc, [key, value]) => {
                const oMetaField = aMetaFields.find((o) => o.name === key);
                if (oMetaField && oMetaField.type === "Edm.Int16") {
                  value = +value;
                }
                return { ...acc, [key]: value };
              }, {});

          if (oSwitches.defect) {
            oFormData.toDefect = this.__mappingStructrePositions(oDefects);
          }
          if (oSwitches.downTime) {
            oFormData.toDowntime = this.__mappingStructrePositions(oDownTimes);
          }

          this.__fireSave(sEntity, oFormData);
        },

        __fireSave(sEntity, oFormData) {
          const fnFireSave = () => {
            this.sendData(sEntity, oFormData).then(() => {
              this.__bindView();
              this.__clearStatesFields();
              MessageBox.success("Форма успешно отправлена.");
            });
          };

          MessageBox.information(
            "Вы уверены, что хотите отправить форму в SAP?",
            {
              actions: [MessageBox.Action.YES, MessageBox.Action.NO],
              onClose: function (action) {
                if (action == sap.m.MessageBox.Action.YES) {
                  fnFireSave();
                }
              },
            }
          );
        },

        __validateFields() {
          const oModel = this.getModel(),
            oFormData = this.getView().getBindingContext().getObject(),
            aTableData = this.getStateProperty("/tables"),
            oSwitchesData = this.getStateProperty("/switches"),
            oDefectsData = aTableData.defect,
            oDownTimesData = aTableData.downTime,
            aRequiredFields = this.getStateProperty("/requiredFields"),
            aMetaFields =
              oModel.oMetadata._getEntityTypeByPath(
                "/OPER_CONV_ROOLSet"
              ).property,
            oFieldsFormat = this.getStateProperty("/fieldsFormat");
          let hasError = false;

          this.__clearErrorFields();

          const fnPushErrorField = (oMetaField, oParams) => {
            const sFieldName = oMetaField.name,
              sFieldLabel =
                oMetaField.extensions.find((o) => o.name === "label")?.value ||
                sFieldName,
              foundFormat = oFieldsFormat[sFieldName],
              isTableError = !!oParams,
              sMessage = isTableError
                ? `Позиция №${oParams.index + 1} - "${sFieldLabel}"`
                : `Поле "${sFieldLabel}"`;
            let sErrorText = "Поле обязательно для заполнения";

            if (foundFormat) {
              sErrorText = foundFormat;
            }

            this.__addErrorMessage({
              field: isTableError
                ? `${sFieldName}_${oParams.index}`
                : sFieldName,
              message: sMessage,
              additionalText: sErrorText,
              group: oParams ? oParams.groupName : "Данные формы",
              type: oParams ? "Warning" : "Error",
            });
            if (oParams) {
              const sFieldPath = `${oParams.path}/${oParams.index}/${sFieldName}`;
              this.setStateProperty(`${sFieldPath}_error`, true);
            } else {
              this.setStateProperty(`/errorFields/${sFieldName}`, true);
            }
            hasError = true;
          };

          const fnCheckFormData = () => {
            aRequiredFields.forEach((sField) => {
              const fieldValue = oFormData[sField],
                foundFromErrors = this.getStateProperty(
                  `/errorFields/${sField}`
                ),
                foundMetaField = aMetaFields.find((o) => o.name === sField);
              if (foundFromErrors) {
                fnPushErrorField(foundMetaField);
              }
              switch (foundMetaField?.type) {
                case "Edm.String":
                  if (!fieldValue) {
                    fnPushErrorField(foundMetaField);
                  }
                  break;
                case "Edm.DateTime":
                  if (!fieldValue) {
                    fnPushErrorField(foundMetaField);
                  }
                  break;
                case "Edm.Decimal":
                  if (!+fieldValue) {
                    fnPushErrorField(foundMetaField);
                  }
                  break;
                case "Edm.Int16":
                  if (!+fieldValue) {
                    fnPushErrorField(foundMetaField);
                  }
                  break;
                default:
                  if (!fieldValue) {
                    fnPushErrorField(foundMetaField);
                  }
                  break;
              }
            });
          };

          const fnCheckPositions = (oEntryPosition) => {
            const { path, items, requiredFields, entitySet, groupName } =
                oEntryPosition,
              aMetaFields =
                oModel.oMetadata._getEntityTypeByPath(entitySet).property;

            if (!items.length) {
              hasError = true;
              return;
            }

            items.forEach((oItem, index) => {
              requiredFields.forEach((sField) => {
                const foundFromErrors = oItem[`${sField}_error`];
                if (!oItem[sField] || foundFromErrors) {
                  const foundMetaField = aMetaFields.find(
                    (o) => o.name === sField
                  );
                  fnPushErrorField(foundMetaField, {
                    path: path,
                    index: index,
                    groupName: groupName,
                  });
                }
              });
            });
          };

          fnCheckFormData();

          if (oSwitchesData.defect) {
            oDefectsData.entitySet = "DEFECTSet";
            oDefectsData.groupName = "Позиции дефектов";
            fnCheckPositions(oDefectsData);
          }

          if (oSwitchesData.downTime) {
            oDownTimesData.entitySet = "DOWNTIMESet";
            oDownTimesData.groupName = "Позиции простоев";
            fnCheckPositions(oDownTimesData);
          }

          if (oSwitchesData.roll && oFormData.Zformat1 !== oFormData.Zformat2) {
            fnPushErrorField(aMetaFields.find((o) => o.name === "Zformat1"));
            fnPushErrorField(aMetaFields.find((o) => o.name === "Zformat2"));
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

        __clearErrorFields() {
          this.setStateProperty("/errorFields", {});
          this.__clearMessages();
        },

        __clearStatesFields() {
          this.__clearErrorFields();
          this.setStateProperty("/tables/defect/items", []);
          this.setStateProperty("/tables/downTime/items", []);
          this.setStateProperty("/switches", {
            defect: false,
            downTime: false,
            roll: false,
            rollEnabled: false,
          });
          this.setStateProperty("/rollData/roll1", {});
          this.setStateProperty("/rollData/roll2", {});
        },
      }
    );
  }
);
