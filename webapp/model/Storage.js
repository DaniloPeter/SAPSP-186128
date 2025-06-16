sap.ui.define([], function () {
  "use strict";

  return {
    saveData(key, data, errors = null) {
      return new Promise((resolve, reject) => {
        try {
          if (!window.localStorage) {
            throw new Error("localStorage не доступен");
          }

          const item = { data, timestamp: Date.now() };
          if (errors) item.errors = errors;

          localStorage.setItem(key, JSON.stringify(item));
          resolve();
        } catch (error) {
          const errorMsg = this._getErrorMessage(error);
          console.error("StorageService.saveData error:", errorMsg);
          reject({ error: errorMsg });
        }
      });
    },

    // Функция для получения данных
    getData(key, validateTime = true) {
      return new Promise((resolve, reject) => {
        try {
          if (!window.localStorage) {
            throw new Error("localStorage не доступен");
          }

          const itemStr = localStorage.getItem(key);
          if (!itemStr) return resolve();

          const item = JSON.parse(itemStr);
          if (!item?.data) throw new Error("Неверный формат данных");

          // Проверка срока действия
          if (
            validateTime &&
            Date.now() - item.timestamp > 12 * 60 * 60 * 1000
          ) {
            localStorage.removeItem(key);
            return resolve();
          }

          // Обработка дат
          const processedData = this._processData(item.data);
          resolve({
            data: processedData,
            errors: item.errors || null,
          });
        } catch (error) {
          const errorMsg = this._getErrorMessage(error);
          console.error("StorageService.getData error:", errorMsg);
          reject({ error: errorMsg });
        }
      });
    },

    clearData(key) {
      return new Promise((resolve, reject) => {
        try {
          localStorage.removeItem(key);
          resolve();
        } catch (error) {
          const errorMsg = this._getErrorMessage(error);
          console.error("StorageService.clearData error:", errorMsg);
          reject({ error: errorMsg });
        }
      });
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
