sap.ui.define([], function () {
  "use strict";

  return {
    saveData(key, data, errors = null, storageType = "local") {
      return new Promise((resolve, reject) => {
        try {
          const storage = this._getStorage(storageType);
          if (!storage) {
            throw new Error(`${storageType}Storage не доступен`);
          }
          const allowedFields = [
            "Werks",
            "WpResource",
            "WpOperatingmode",
            "Smen",
            "Brig",
            "Zprinter",
            "Lgort",
          ];
          const filteredData = {};
          allowedFields.forEach((field) => {
            if (data.hasOwnProperty(field)) {
              filteredData[field] = data[field];
            }
            if (field === "Brig" && data.hasOwnProperty("BRIGSet")) {
              filteredData["BRIGSet"] = data["BRIGSet"];
            }
          });

          const item = {
            data: filteredData,
            timestamp: Date.now(),
          };
          if (errors) {
            const filteredErrors = {};
            allowedFields.forEach((field) => {
              if (errors.hasOwnProperty(field)) {
                filteredErrors[field] = errors[field];
              }
            });
            item.errors = filteredErrors;
          }

          storage.setItem(key, JSON.stringify(item));
          resolve();
        } catch (error) {
          const errorMsg = this._getErrorMessage(error);
          console.error(
            `StorageService.saveData error (${storageType}):`,
            errorMsg,
          );
          reject({ error: errorMsg });
        }
      });
    },

    // Функция для получения данных
    getData(key, validateTime = true, storageType = "local") {
      return new Promise((resolve, reject) => {
        try {
          const storage = this._getStorage(storageType);
          if (!storage) {
            throw new Error(`${storageType}Storage не доступен`);
          }

          const itemStr = storage.getItem(key);
          if (!itemStr) return resolve();

          const item = JSON.parse(itemStr);
          if (!item?.data) throw new Error("Неверный формат данных");

          // Проверка срока действия
          if (
            validateTime &&
            Date.now() - item.timestamp > 12 * 60 * 60 * 1000
          ) {
            storage.removeItem(key);
            return resolve();
          }

          // Обработка дат
          const processedData = this._processData(item.data);
          resolve({
            data: processedData,
            errors: item?.errors || null,
          });
        } catch (error) {
          const errorMsg = this._getErrorMessage(error);
          console.error(
            `StorageService.getData error (${storageType}):`,
            errorMsg,
          );
          reject({ error: errorMsg });
        }
      });
    },

    clearData(key, storageType = "local") {
      return new Promise((resolve, reject) => {
        try {
          const storage = this._getStorage(storageType);
          storage.removeItem(key);
          resolve();
        } catch (error) {
          const errorMsg = this._getErrorMessage(error);
          console.error(
            `StorageService.clearData error (${storageType}):`,
            errorMsg,
          );
          reject({ error: errorMsg });
        }
      });
    },

    // Вспомогательный метод для получения нужного хранилища
    _getStorage(type) {
      if (type === "session" && window.sessionStorage) {
        return sessionStorage;
      } else if (type === "local" && window.localStorage) {
        return localStorage;
      }
      return null;
    },

    // Вспомогательные методы
    _processData(data) {
      return Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = key.includes("date") && value ? new Date(value) : value;
        return acc;
      }, {});
    },

    _getErrorMessage(error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        return "Недостаточно места в хранилище";
      }
      return error.message || "Неизвестная ошибка хранилища";
    },
  };
});
