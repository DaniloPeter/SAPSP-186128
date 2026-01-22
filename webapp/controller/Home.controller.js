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
    "com/segezha/form/roll/conversion/model/MessageModel",
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
    MessageModel,
  ) => {
    "use strict";

    return BaseController.extend(
      "com.segezha.form.roll.conversion.controller.Home",
      {
        onInit() {
          this.__bindView();
          this.__oMessageModel = new MessageModel(this.getView());
        },

        onAfterRendering() {
          const inputs = document.querySelectorAll(".sapMInputBaseInner");
          inputs.forEach((input) => {
            input.addEventListener("focus", function () {
              const iValue = +this.value.replace(",", ".");
              if (!isNaN(iValue) && iValue === 0) {
                // Сохраняем предыдущее значение только если был 0
                this.value = "";
                updateUI5Input(this, "");
              }
            });

            function updateUI5Input(oInput, sValue) {
              const ui5Input = sap.ui
                .getCore()
                .byId(oInput.id.replace("-inner", ""));
              if (!ui5Input) return;

              ui5Input.setValue(sValue);

              // Синхронизация с моделью
              const oBinding = ui5Input.getBinding("value");
              if (oBinding) {
                oBinding.setValue(sValue);
              }
            }
          });
        },

        __bindView() {
          const oModel = this.getModel(),
            oStateModel = this.getModel("state"),
            oView = this.getView();
          oModel.metadataLoaded().then(() => {
            const sPath = oModel.createKey("/OPER_CONV_ROOLSet", {
              Idconvroll: "10",
            });

            const updateModelProperties = async (
              oResponse,
              bInitial = false,
            ) => {
              try {
                const oFormData = await this.storage.getData("sessionFormData"),
                  oDraftFormSettings =
                    await this.storage.getData("draftFormData"),
                  oDraftFormData = oDraftFormSettings?.data,
                  oDraftFormErrors = oDraftFormSettings?.errors;
                let oExistedFields = {};
                if (oFormData) {
                  const { data } = oFormData;
                  oExistedFields = {
                    Werks: data.Werks,
                    Zlogin: data.Zlogin,
                  };
                  this.setStateProperty(
                    "/valueHelps/BRIGSet",
                    data?.BRIGSet || [],
                  );
                  this.setStateProperty("/valueHelps/QMSet", data?.QMSet || []);
                }
                if (oDraftFormData) {
                  const aSkipFields = [
                      "toDefect",
                      "toDowntime",
                      "BRIGSet",
                      "QMSet",
                      "switches",
                    ],
                    oNewDraftData = Object.entries(oDraftFormData).reduce(
                      (acc, [key, value]) => {
                        if (aSkipFields.includes(key)) return acc;
                        acc[key] = value;
                        return acc;
                      },
                      {},
                    );
                  oExistedFields = this.utils.mergePreserveFilled(
                    oExistedFields,
                    oNewDraftData,
                  );

                  this.setStateProperty(
                    "/valueHelps/BRIGSet",
                    oDraftFormData?.BRIGSet || [],
                  );

                  this.setStateProperty(
                    "/valueHelps/QMSet",
                    oDraftFormData?.QMSet || [],
                  );

                  if (oDraftFormErrors) {
                    this.setStateProperty("/errorFields", oDraftFormErrors);
                  }
                }

                if (oDraftFormData?.switches) {
                  this.setStateProperty("/switches", oDraftFormData.switches);
                }

                if (oDraftFormData?.toDefect) {
                  this.setStateProperty(
                    "/tables/defect/items",
                    oDraftFormData.toDefect,
                  );
                }

                if (oDraftFormData?.toDowntime) {
                  this.setStateProperty(
                    "/tables/downTime/items",
                    oDraftFormData.toDowntime.map((o) => {
                      return Object.entries(o).reduce((acc, [key, value]) => {
                        acc[key] = value;
                        if (
                          typeof value === "string" &&
                          value.startsWith("PT")
                        ) {
                          acc[key] = this.utils.isoDurationToDate(value);
                        }
                        return acc;
                      }, {});
                    }),
                  );
                }

                Object.entries(oResponse || oExistedFields).forEach(
                  ([key, value]) => {
                    if (key === "__metadata") return;
                    oModel.setProperty(
                      `${sPath}/${key}`,
                      oExistedFields[key] || value,
                    );
                  },
                );
                oModel.setProperty(`${sPath}/Zfullnameqa`, "");

                if (bInitial) {
                  const sRollNum1 = oDraftFormData?.RollNum1,
                    sRollNum2 = oDraftFormData?.RollNum2;

                  if (sRollNum1 && sRollNum2) {
                    this.__getDataRoll();
                    return;
                  }
                  if (sRollNum1) {
                    this.__getDataRoll(sRollNum1, "1");
                  }
                  if (sRollNum2) {
                    this.__getDataRoll(sRollNum2, "2");
                  }
                }
              } catch (oError) {
                const sErrorText = oError.error;
                if (sErrorText) {
                  MessageBox.error(sErrorText);
                }
              }
            };

            if (oView.getBindingContext()) {
              oModel.refresh(true);
              this.readOData(sPath).then((oResponse) => {
                updateModelProperties(oResponse);
              });
              return;
            }

            oView.bindElement({
              path: sPath,
              events: {
                change: () => {
                  updateModelProperties(null, true);
                },
              },
            });
          });

          oStateModel.attachPropertyChange(
            this.__attachPropertyChange.bind(this),
          );
          oModel.attachPropertyChange(this.__attachPropertyChange.bind(this));
        },

        __attachPropertyChange() {
          const oFormData = this.getFormData(),
            aBrigSet = this.getStateProperty("/valueHelps/BRIGSet"),
            aQmSet = this.getStateProperty("/valueHelps/QMSet"),
            oErrorFields = this.getStateProperty("/errorFields"),
            oSwitchesData = this.getStateProperty("/switches");
          if (aBrigSet && aBrigSet.length) {
            oFormData.BRIGSet = aBrigSet;
          }
          if (aQmSet && aQmSet.length) {
            oFormData.QMSet = aQmSet;
          }
          if (oSwitchesData) {
            oFormData.switches = oSwitchesData;
          }

          this.saveStorageData("draftFormData", oFormData, oErrorFields);
        },

        onChangeWpResource(oEvent) {
          const oSource = oEvent.getSource();
          const oSelectedItem = oSource.getSelectedItem();

          if (!oSelectedItem) {
            MessageBox.warning("Нет выбранного элемента в списке");
            return;
          }

          const oItemContext = oSelectedItem.getBindingContext();
          if (!oItemContext) {
            MessageBox.warning(
              "Нету привязки к модели данных у выбранного элемента",
            );
            return;
          }

          const { WpResource, Lgort } = oItemContext.getObject() || {};
          if (!Lgort) {
            MessageBox.warning(
              "Поле Lgort не определено для ресурса:",
              WpResource,
            );
            return;
          }
          const oBindingContext = this.getView().getBindingContext(),
            oBindingData = oBindingContext.getObject(),
            sBindingPath = oBindingContext.getPath(),
            oModel = this.getModel();

          oModel.setProperty(`${sBindingPath}/Lgort`, Lgort);
          this.setStateProperty(`/errorFields/Lgort`, false);
          this.onChangeCommonField(oSource);

          const oPayload = {
            WpResource: WpResource,
            Werks: oBindingData.Werks,
          };

          this.callODataFunction("/GetTplnr", oPayload)
            .then((oResponse) => {
              const { TPLNR } = oResponse.TPLNR;
              if (TPLNR) {
                oModel.setProperty(`${sBindingPath}/Tplnr`, TPLNR);
              }
            })
            .catch((err) => {
              MessageBox.warning(
                "Не удалось определить TPLNR для выбранного ресурса.",
              );
              console.error("GetTplnr error:", err);
            });

          const aFilters = [
            new Filter("WpResource", FilterOperator.EQ, WpResource),
            new Filter("Werks", FilterOperator.EQ, oBindingData.Werks),
          ];

          this.readOData("/BRIGSet", {
            filters: aFilters,
          })
            .then((oResponse) => {
              this.setStateProperty("/valueHelps/BRIGSet", oResponse.results);
              oModel.setProperty(`${sBindingPath}/Brig`, "");
              this.__attachPropertyChange();
            })
            .catch((err) => {
              this.setStateProperty("/valueHelps/BRIGSet", []);
              this.__attachPropertyChange();
              MessageBox.warning(
                "Не удалось получить список бригад (BRIGSet).",
              );
              console.error("BRIGSet read error:", err);
            });

          this.readOData("/QMSet", {
            filters: aFilters,
          })
            .then((oResponse) => {
              this.setStateProperty("/valueHelps/QMSet", oResponse.results);
              this.__attachPropertyChange();
            })
            .catch((err) => {
              this.setStateProperty("/valueHelps/QMSet", []);
              this.__attachPropertyChange();
              MessageBox.warning("Не удалось получить список QM (QMSet).");
              console.error("QMSet read error:", err);
            });

          // проверка рулонов отключена — не вызываем __getDataRoll
          // вернули проверку рулонов

          if (oBindingData.RollNum1) {
            this.__getDataRoll(oBindingData.RollNum1, "1");
          }

          if (oBindingData.RollNum2) {
            this.__getDataRoll(oBindingData.RollNum2, "2");
          }
        },

        onChangeWpOperatingmode(oEvent) {
          const oSource = oEvent.getSource(),
            oModel = this.getModel(),
            sSelectedKey = oSource.getSelectedKey(),
            sBindingPath = this.getView().getBindingContext().getPath();

          if (sSelectedKey === "1141" || sSelectedKey === "1142") {
            this.setStateProperty("/switches/roll", false);
            this.setStateProperty("/switches/rollEnabled", false);
            oModel.setProperty(`${sBindingPath}/RollNum2`, "");
            oModel.setProperty(
              `${sBindingPath}/Zformat2`,
              this.utils.zeroString(3),
            );
            oModel.setProperty(
              `${sBindingPath}/Zradius2`,
              this.utils.zeroString(0),
            );
          } else {
            this.setStateProperty("/switches/rollEnabled", true);
          }

          this.onChangeCommonField(oSource);
        },

        onChangeZprinter(oEvent) {
          const oSource = oEvent.getSource(),
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

        onPressPasteAufnr() {
          const oModel = this.getModel(),
            oBindingContext = this.getView().getBindingContext(),
            oBindingData = oBindingContext.getObject(),
            sBindingPath = oBindingContext.getPath(),
            aTechFields = Object.entries(oBindingData).filter(
              ([sKey, sValue]) => !!sValue && sKey.includes("Tech"),
            );

          aTechFields.forEach(([sKey, sValue]) => {
            const sFieldName = sKey.replace("Tech", "");
            oModel.setProperty(`${sBindingPath}/${sFieldName}`, sValue);
            this.setStateProperty(`/errorFields/${sFieldName}`, false);
          });

          this.__attachPropertyChange();
        },

        onChangeAufnr(oEvent) {
          const oSource = oEvent.getSource(),
            oModel = this.getModel(),
            oBindingContext =
              oSource.getBindingContext() || this.getView().getBindingContext(),
            sBindingPath = oBindingContext ? oBindingContext.getPath() : null,
            sValue = oSource.getValue(),
            isFullValue = sValue && !sValue.includes("_");

          if (!oBindingContext) {
            MessageBox.warning("Нету привязки к модели для поля заказа");
            return;
          }

          if (!isFullValue) {
            oModel.setProperty(`${sBindingPath}/Klishe`, "");
            oModel.setProperty(`${sBindingPath}/Zklishetext`, "");
            this.setStateProperty("/errorFields/Aufnr", true);
            return;
          }

          this.setStateProperty("/errorFields/Aufnr", false);

          this.onChangeCommonField(oSource);
          // отключен запрос на сервер для получения клише по заказу
          // только локальные изменения в модели
          // oModel.setProperty(`${sBindingPath}/Klishe`, "");
          // oModel.setProperty(`${sBindingPath}/Zklishetext`, "");
          // this.setStateProperty("/errorFields/Klishe", false);
          // this.__attachPropertyChange();

          //TODO вернули заполнение клише по номеру заказа
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

            this.__attachPropertyChange();
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
            oSelectedRowBinding.Zlogin,
          );
          this.__attachPropertyChange();
        },

        onChangeZnewformat(oEvent) {
          const oSource = oEvent.getSource();
          // отключил клиентскую проверку
          this.onChangeCommonField(oSource);
        },

        onChangeRollNum(oEvent) {
          const oSource = oEvent.getSource(),
            oModel = this.getModel(),
            oBindingContext = this.getView().getBindingContext(),
            oBindingData = oBindingContext.getObject(),
            sBindingPath = oBindingContext.getPath(),
            sValue = oSource.getValue(),
            sBindingValue = oSource.getBinding("value").getPath(),
            bSwitchActive = this.getStateProperty("/switches/roll"),
            sRollNum = sBindingValue.includes("1") ? "1" : "2";

          if (!sValue) {
            this.setStateProperty(`/rollData/roll${sRollNum}/Material`, "");
            this.setStateProperty(`/rollData/roll${sRollNum}/Charg`, "");
            oModel.setProperty(`${sBindingPath}/Zformat${sRollNum}`, "0");
            this.__attachPropertyChange();
            return;
          }

          if (
            bSwitchActive &&
            oBindingData.RollNum1 === oBindingData.RollNum2
          ) {
            this.setStateProperty("/errorFields/RollNum1", true);
            MessageBox.error("№ рулона 1 не должен совпадать с № рулона 2.");
            return;
          }

          this.setStateProperty("/errorFields/RollNum1", false);
          this.setStateProperty("/errorFields/RollNum2", false);

          this.onChangeCommonField(oSource);
          // отключена проверка рулона не вызываем __getDataRoll

          //TODO вернули проверку рулона
          this.__getDataRoll(sValue, sRollNum);
        },

        async __getDataRoll(sRollValue, sRollNum) {
          const oModel = this.getModel();
          const oView = this.getView();
          const oBindingContext = oView.getBindingContext();
          const sBindingPath = oBindingContext.getPath();
          const oBindingData = oBindingContext.getObject();
          const bSwitchActive = this.getStateProperty("/switches/roll");
          const { Werks, Lgort } = oBindingData;

          if (!Werks || !Lgort) return;

          const setErrorFields = (state = false) => {
            ["RollNum1", "Zformat1"].forEach((field) =>
              this.setStateProperty(`/errorFields/${field}`, state),
            );
          };

          const setValues = (oValues, sRollNum) => {
            const { ValueFrom, Matnr, Charg } = oValues;
            const sAnotherRoll = sRollNum === "1" ? "2" : "1";
            const oAnotherRollData = this.getStateProperty(
              `/rollData/roll${sAnotherRoll}`,
            );
            const sAnotherFormatValue = oBindingData[`Zformat${sAnotherRoll}`];

            const formattedValue = this.utils.formatStringValueFrom(ValueFrom);
            const formattedAnotherValue =
              this.utils.formatStringValueFrom(sAnotherFormatValue);

            this.setStateProperty(`/rollData/roll${sRollNum}/Material`, Matnr);
            this.setStateProperty(`/rollData/roll${sRollNum}/Charg`, Charg);

            let errors = [];

            if (bSwitchActive) {
              if (
                oAnotherRollData?.Material &&
                oAnotherRollData.Material !== Matnr
              ) {
                errors.push(`Материалы рулонов должны совпадать.`);
              }
              if (+formattedValue !== +formattedAnotherValue) {
                errors.push(`Форматы исходных рулонов должны совпадать.`);
              }
            }

            if (!errors.length && formattedValue) {
              oModel.setProperty(
                `${sBindingPath}/Zformat${sRollNum}`,
                formattedValue,
              );
            }

            return errors;
          };

          const callBackend = async (sRollValue, sRollNum) => {
            try {
              const oResponse = await this.callODataFunction("/GetDataRoll", {
                Werks,
                Lgort,
                RollNum: sRollValue,
              });

              this.__oMessageModel.__filterMessages({
                bindingValue: `RollNum${sRollNum}`,
              });

              const errors = setValues(oResponse, sRollNum);
              return { errors };
            } catch (err) {
              setErrorFields(true);
            } finally {
              this.__attachPropertyChange();
            }
          };

          try {
            if (sRollNum) {
              await callBackend(sRollValue, sRollNum);
            } else if (oBindingData.RollNum1 && oBindingData.RollNum2) {
              await Promise.all([
                callBackend(oBindingData.RollNum1, "1"),
                callBackend(oBindingData.RollNum2, "2"),
              ]);
            }
            setErrorFields(false);
          } catch (e) {
            console.error("Ошибка при обработке рулонов:", e);
          }
        },

        onChangeMetersOrReport(oEvent) {
          const oSource = oEvent.getSource(),
            sFieldName = oSource.getBinding("value").getPath(),
            isChangeZpm = sFieldName === "Zpm",
            oBindingContext = this.getView().getBindingContext(),
            sBindingPath = oBindingContext.getPath(),
            oModel = this.getModel();
          if (this.onChangeCommonField(oSource)) {
            oModel.setProperty(
              `${sBindingPath}/Zstamp`,
              this.utils.zeroString(0),
            );
            this.setStateProperty("/errorFields/Zstamp", true);
            return;
          }

          const oBindingData = oBindingContext.getObject(),
            iPrintMeters = +oBindingData.Zpm,
            iReportLength = +oBindingData.Zlengthreport,
            sCalcOverPrints = this.utils.calculateOverPrints(
              iPrintMeters,
              iReportLength,
            ),
            isError = sCalcOverPrints.length > 5 || +sCalcOverPrints <= 0;

          this.setStateProperty("/errorFields/Zstamp", isError);

          if (sCalcOverPrints.length > 5) {
            MessageBox.error("Количество 'Оттисков' не может превышать 99999.");
          }

          oModel.setProperty(`${sBindingPath}/Zstamp`, sCalcOverPrints);

          setTimeout(() => {
            if (isChangeZpm && +oBindingData.Zpm <= 99) {
              this.setStateProperty("/errorFields/Zpm", true);
              MessageBox.error(
                "Количество 'Погонных метров' должно быть больше 99 и не может превышать 99999.",
              );
              oSource.setValue("0");
            }
            this.__attachPropertyChange();
          });
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
              oItem.Auztb,
            ),
            isError = !iCalcDownTime;

          if (isError && oItem.Auztb) {
            MessageBox.error(
              "Введите время начала простоя, не превышающее время окончания.",
            );
          }
          this.setStateProperty(`${sItemPath}/Zdownhours_error`, isError);
          this.setStateProperty(`${sItemPath}/Zdownhours`, iCalcDownTime);
          this.__attachPropertyChange();
        },

        onSwitch(oEvent, sType) {
          const bSelected = oEvent.getParameter("state");
          switch (sType) {
            case "defect":
              if (bSelected) {
                this._addEmptyRow("/tables/defect/items", 4, true);
              } else {
                this.setStateProperty("/tables/defect/items", []);
                this.__oMessageModel.__filterMessages({
                  target: "Позиции дефектов",
                });
              }
              break;
            case "downTime":
              if (bSelected) {
                this._addEmptyRow("/tables/downTime/items", 3, true);
              } else {
                this.setStateProperty("/tables/downTime/items", []);
                this.__oMessageModel.__filterMessages({
                  target: "Позиции простоев",
                });
              }
              break;
            case "roll":
              if (!bSelected) {
                const oModel = this.getModel(),
                  oBindingContext = oEvent.getSource().getBindingContext(),
                  oBindingData = oBindingContext.getObject(),
                  sBindingPath = oBindingContext.getPath();
                oModel.setProperty(`${sBindingPath}/RollNum2`, "");
                oModel.setProperty(
                  `${sBindingPath}/Zformat2`,
                  this.utils.zeroString(),
                );
                oModel.setProperty(
                  `${sBindingPath}/Zradius2`,
                  this.utils.zeroString(1),
                );
                this.setStateProperty(`/errorFields/RollNum2`, false);
                this.setStateProperty(`/errorFields/Zformat2`, false);
                this.setStateProperty(`/errorFields/Zradius2`, false);

                if (oBindingData.RollNum1) {
                  this.setStateProperty(`/errorFields/RollNum1`, false);
                }
                if (+oBindingData.Zformat1) {
                  this.setStateProperty(`/errorFields/Zformat1`, false);
                }
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
              this.__attachPropertyChange();
            }
            return;
          }
          if (aTablePositions.length >= iLimit) {
            MessageToast.show(`Нельзя добавить более ${iLimit} позиций.`);
            return;
          }
          this.setStateProperty(sBindingTable, [...aTablePositions, {}]);
          this.__attachPropertyChange();
        },

        _removeRows(sBindingTable, aSelectedIndexes) {
          let aTablePositions = this.getStateProperty(sBindingTable);
          aTablePositions = aTablePositions.filter(
            (_, index) => !aSelectedIndexes.includes(index),
          );
          this.setStateProperty(sBindingTable, aTablePositions);
          this.__oMessageModel.__filterMessages({
            target: sBindingTable.includes("defect")
              ? "Позиции дефектов"
              : "Позиции простоев",
            removeIndexes: aSelectedIndexes,
          });
        },

        onVHDownTimeRequested(oEvent) {
          const oSource = oEvent.getSource(),
            aFields = ["Qmcod", "Kurztext", "Qmgrp", "Kurztext2"];
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
              if (oTable) {
                oTable.setNoData("Заполните ресурс для получения результатов.");
              }
              if (oTable.bindRows) {
                aFields.forEach((sField, index) => {
                  const tempColumn = new UIColumn({
                    label: new Label({
                      text: `{/#QM/${sField}/@sap:label}`,
                    }),
                    template: new Text({
                      wrapping: false,
                      text: `{state>${sField}}`,
                    }),
                  });

                  if (index === 1 || index === 3) {
                    tempColumn.setWidth("350px");
                  }
                  oTable.addColumn(tempColumn);
                });

                oTable.bindAggregation("rows", {
                  path: "state>/valueHelps/QMSet",
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

        onClearFormData() {
          const fnClear = async () => {
            this.__clearStatesFields();

            // очищаем все данные в localStorage
            await this.storage.clearData("sessionFormData");
            await this.storage.clearData("draftFormData");

            this.__bindView();
          };

          MessageBox.information("Вы уверены, что хотите очистить форму?", {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: function (action) {
              if (action == sap.m.MessageBox.Action.YES) {
                fnClear();
              }
            },
          });
        },

        onConfirmFormData() {
          const hasError = this.__validateFields();

          if (hasError) {
            this.onMessagePopoverPress();
            return;
          }

          const oFormData = this.getFormData();
          this.__fireSave("/OPER_CONV_ROOLSet", oFormData);
        },

        __fireSave(sEntity, oFormData) {
          const fnFireSave = () => {
            this.setBusy(true);
            this.sendData(sEntity, oFormData)
              .then(() => {
                const oSessionData = {
                  Werks: oFormData.Werks,
                  Zlogin: oFormData.Zlogin,
                };
                this.saveStorageData("sessionFormData", oSessionData);

                this.storage.clearData("draftFormData");

                this.__clearStatesFields();
                this.__bindView();
                MessageBox.success("Форма успешно отправлена.");
              })
              .catch((oError) => {
                // при ошибке тоже очищаем все данные в localStorage и форме
                this.storage.clearData("draftFormData");
                this.storage.clearData("sessionFormData");
                this.__clearStatesFields();
                this.__bindView();
                const sErrorText = oError?.error;
                if (sErrorText) {
                  MessageBox.error(sErrorText);
                }
              })
              .finally(() => {
                this.setBusy(false);
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
            },
          );
        },

        __validateFields() {
          const oModel = this.getModel(),
            oFormData = this.getView().getBindingContext().getObject(),
            aTableData = this.getStateProperty("/tables"),
            oSwitchesData = this.getStateProperty("/switches"),
            oDefectsData = aTableData.defect,
            oDownTimesData = aTableData.downTime,
            aMetaFields =
              oModel.oMetadata._getEntityTypeByPath(
                "/OPER_CONV_ROOLSet",
              ).property,
            aRequiredFields = this.getStateProperty("/requiredFields"),
            oFieldsFormat = this.getStateProperty("/fieldsFormat");
          let hasError = false;

          this.__oMessageModel.__clearMessages();

          const fnPushErrorField = (
            oMetaField,
            oParams,
            fieldHasError = false,
          ) => {
            hasError = true;

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

            this.__oMessageModel.__addErrorMessage({
              field: isTableError
                ? `${sFieldName}_${oParams.index}`
                : sFieldName,
              message: sMessage,
              additionalText: sErrorText,
              group: oParams ? oParams.groupName : "Данные формы",
              type: oParams ? "Warning" : "Error",
            });

            if (fieldHasError) {
              return;
            }

            setTimeout(() => {
              if (oParams) {
                const sFieldPath = `${oParams.path}/${oParams.index}/${sFieldName}`;
                this.setStateProperty(`${sFieldPath}_error`, true);
              } else {
                this.setStateProperty(`/errorFields/${sFieldName}`, true);
              }
            }, 0);
          };

          const fnCheckFormData = () => {
            aRequiredFields.forEach((sField) => {
              // пропускаем валидацию
              if (
                ["Zformat1", "Zformat2", "Znewformat", "Klishe"].includes(
                  sField,
                )
              ) {
                return;
              }
              const fieldValue = oFormData[sField],
                foundFromErrors = this.getStateProperty(
                  `/errorFields/${sField}`,
                ),
                foundMetaField = aMetaFields.find((o) => o.name === sField);
              if (foundFromErrors) {
                fnPushErrorField(foundMetaField, null, true);
                return;
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
                case "Edm.Int32":
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
                    (o) => o.name === sField,
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
          return hasError;
        },

        __clearStatesFields() {
          this.__oMessageModel.__clearMessages();
          this.setStateProperty("/errorFields", {});
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

        async onViewDraftData(oEvent) {
          const oButton = oEvent.getSource();
          const oDraftFormData = await this.storage.getData("draftFormData");

          let aData = [];

          if (oDraftFormData && oDraftFormData.data) {
            Object.entries(oDraftFormData.data).forEach(([sKey, oValue]) => {
              if (typeof oValue === "object") {
                return;
              }

              aData.push({
                text: `${sKey}: ${oValue}`,
              });
            });
          }

          this.setStateProperty("/draftData", aData);
          this.getDialog("DraftData").then((oDialog) =>
            oDialog.openBy(oButton),
          );
        },
      },
    );
  },
);
