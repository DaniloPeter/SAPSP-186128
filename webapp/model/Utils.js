sap.ui.define([], function () {
  "use strict";

  return {
    calculateOverPrints(printMeters, reportLength) {
      const iPrintMeters = +printMeters,
        iReportLength = +reportLength;
      if (!iPrintMeters || !iReportLength) return 0;

      return Math.floor((iPrintMeters / (iReportLength * 0.01))).toString();
    },

    removeTimeZoneTime(time) {
      return time + new Date().getTimezoneOffset() * 60 * 1000;
    },

    isoDurationToDate(isoDuration) {
      const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
      const matches = isoDuration.match(regex);
      const hours = parseInt(matches[1] || "0", 10);
      const minutes = parseInt(matches[2] || "0", 10);
      const seconds = parseInt(matches[3] || "0", 10);

      const date = new Date();
      date.setHours(hours, minutes, seconds, 0);
      return date;
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

    stringToNumber(str) {
      return +str.replace(/ /g, "").replace(",", ".");
    },

    formatStringValueFrom(str) {
      try {
        const iValue = this.stringToNumber(str);
        return iValue.toFixed(3);
      } catch (e) {
        return this.zeroString();
      }
    },

    zeroString(iFixed = 3) {
      return (0).toFixed(iFixed);
    },
  };
});
