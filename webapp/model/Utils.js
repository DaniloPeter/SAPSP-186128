sap.ui.define([], function () {
  "use strict";

  return {
    calculateOverPrints(printMeters, reportLength) {
      const iPrintMeters = +printMeters,
        iReportLength = +reportLength;
      if (!iPrintMeters || !iReportLength) return 0;
      return (iPrintMeters / (iReportLength * 0.01)).toFixed(2);
    },

    convertMillisecondsToTime(ms) {
      // Конвертирует миллисекунды в {часы минуты секунды}
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((ms % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    },

    timeToDate(oTime) {
      // Изменяем Thu Jan 01 1970 на актуальную дату
      const newDate = new Date();
      newDate.setHours(oTime.getHours());
      newDate.setMinutes(oTime.getMinutes());
      return newDate;
    },

    calculateDownTime(dateBegin, dateEnd) {
      // Вычисляет время простоя между двумя датами
      if (!dateBegin || !dateEnd) return null;
      const dDateBegin = this.timeToDate(dateBegin);
      const dDateEnd = this.timeToDate(dateEnd);
      const downTime = dDateEnd - dDateBegin;
      debugger;
      const downtimeInTimeFormat = this.convertMillisecondsToTime(downTime);
      return downtimeInTimeFormat.hours + ":" + downtimeInTimeFormat.minutes;
    },
  };
});
