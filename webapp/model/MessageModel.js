/*!
 * OpenUI5
 * (c) Copyright 2009-2024 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define(
  ["sap/ui/base/Object", "sap/ui/core/message/Message"],
  function (UI5Object, Message) {
    "use strict";

    return UI5Object.extend(
      "com.segezha.form.roll.conversion.model.MessageModel",
      {
        constructor: function (oView) {
          const oMessageManager = sap.ui.getCore().getMessageManager();
          this.__oMessageManager = oMessageManager;
          this.__oMainModel = oView.getModel();

          oMessageManager.getMessageModel().setDefaultBindingMode("TwoWay");
          oView.setModel(oMessageManager.getMessageModel(), "message");
          oMessageManager.registerObject(oView, true);
        },

        __addErrorMessage(oMessage) {
          const oMessageTemplate = new Message({
            message: oMessage.message,
            additionalText: oMessage.additionalText || "",
            type: oMessage.type,
            code: oMessage.group,
            target: oMessage.field,
            processor: this.__oMainModel,
          });
          this.__oMessageManager.addMessages(oMessageTemplate);
        },

        __filterMessages(oParams) {
          const oMessageModel = this.__oMessageManager.getMessageModel(),
            aMessagesData = oMessageModel.getData(),
            indexPosition = oParams.tableBinding
              ? oParams.tableBinding.getPath().split("/items/")[1]
              : "",
            sFieldName = indexPosition
              ? `${oParams.bindingValue}_${indexPosition}`
              : oParams.bindingValue;

          const oMappingFields = {
              Znewformat: ["Zformat1", "Zformat2"],
              Zpm: ["Zstamp"],
              Zlengthreport: ["Zstamp"],
              Aufnr: ["Klishe"],
              WpResource: ["Lgort", "/VHTplnrCollection()"],
              RollNum1: ["/VHRollCollection()"],
              RollNum2: ["/VHRollCollection()"],
            },
            aSkipFields = sFieldName
              ? [sFieldName, ...(oMappingFields[sFieldName] ?? [])]
              : [];

          if (aMessagesData.length) {
            const aNewMessages = aMessagesData.filter((o) => {
              const sIndexTableError = o.target.split("_")[1];
              if (aSkipFields.length > 1) {
                return !aSkipFields.includes(o.target);
              }
              if (oParams.target && oParams.removeIndexes && sIndexTableError) {
                return (
                  o.code === oParams.target &&
                  !oParams.removeIndexes.includes(+sIndexTableError)
                );
              }
              if (oParams.target) {
                return o.code !== oParams.target;
              }
              return o.target !== sFieldName && o.target;
            });
            this.__oMessageManager.removeMessages(aMessagesData);
            this.__oMessageManager.addMessages(aNewMessages);
          }
        },
        __clearMessages() {
          this.__oMessageManager.removeAllMessages();
        },
      }
    );
  }
);
