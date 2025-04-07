sap.ui.define([], function () {
  "use strict";

  return {
    // Функция для сохранения данных с временной меткой
    saveData(key, data, errors) {
      const item = {
        data: data,
        timestamp: new Date().getTime(),
      };
      if (errors) {
        item.errors = errors;
      }
      localStorage.setItem(key, JSON.stringify(item));
    },

    // Функция для получения данных
    getData(key, validateTime = true) {
      const item = JSON.parse(localStorage.getItem(key));
      if (!item) return null;

      const now = new Date().getTime();
      const twelveHoursInMs = 12 * 60 * 60 * 1000; // 12 часов в миллисекундах

      // Проверяем, прошло ли более 12 часов
      if (validateTime && now - item.timestamp > twelveHoursInMs) {
        // Если прошло более 12 часов, очищаем данные
        localStorage.removeItem(key);
        return null;
      }

      const newData = Object.entries(item.data).reduce((acc, [key, value]) => {
        acc[key] = value;

        if (key.includes("date")) {
          acc[key] = new Date(value);
        }
        return acc;
      }, {});

      return {
        data: newData,
        errors: item.errors,
      };
    },

    clearData(key) {
      localStorage.removeItem(key);
    },
  };
});
