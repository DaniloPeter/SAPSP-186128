sap.ui.define([], function () {
  "use strict";

  return {
    calculateOverPrints(printMeters, reportLength) {
      const iPrintMeters = +printMeters,
        iReportLength = +reportLength;
      if (!iPrintMeters || !iReportLength) return 0;
      return (iPrintMeters / (iReportLength * 0.01)).toFixed(3);
    },

    removeTimeZoneTime(time) {
      return time + new Date().getTimezoneOffset() * 60 * 1000;
    },

    fromDateToEdmTime(date) {
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `PT${hours}H${minutes}M${seconds}S`;
    },

    calculateDownTime(dateBegin, dateEnd) {
      // Вычисляет время простоя между двумя датами
      if (!dateBegin || !dateEnd) return null;
      const iDiff = +dateEnd - +dateBegin;
      if (iDiff <= 0) {
        return null;
      }
      const iDifferenceTime = this.removeTimeZoneTime(iDiff);
      return new Date(iDifferenceTime);
    },
  };
});
