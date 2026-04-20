sap.ui.define([], function () {
  "use strict";

  const parseISO = function (dateString) {
    if (typeof dateString !== "string") {
      return new Date(NaN);
    }
    const timestamp = Date.parse(dateString);
    if (Number.isNaN(timestamp)) {
      return new Date(NaN);
    }
    return new Date(timestamp);
  };

  const isValid = function (date) {
    if (date instanceof Date) {
      return !Number.isNaN(date.getTime());
    }
    return false;
  };

  return {
    calculateOverPrints(printMeters, reportLength) {
      const iPrintMeters = +printMeters,
        iReportLength = +reportLength;
      if (!iPrintMeters || !iReportLength) return 0;

      return Math.floor(iPrintMeters / (iReportLength * 0.01)).toString();
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

    mergePreserveFilled(existedFields, newFields) {
      const result = { ...existedFields };

      for (const [key, value] of Object.entries(newFields)) {
        const existsInOriginal = key in existedFields;
        const isFilled = value !== null && value !== undefined && value !== "";

        if (!existsInOriginal || isFilled) {
          result[key] = value;
        }
      }
      return result;
    },

    parseDateValue(val, fieldName) {
      if (fieldName !== "Zbudat" && fieldName !== "Zdatetime") {
        return val;
      }

      if (val == null) return val;
      if (val instanceof Date) return val;
      // numbers - treat as ms since epoch
      if (typeof val === "number" && !Number.isNaN(val)) {
        const d = new Date(val);
        return isValid(d) ? d : val;
      }
      if (typeof val === "string") {
        // Microsoft JSON date /Date(1234567890)/
        const msMatch = val.match(/\/Date\((-?\d+)\)\//);
        if (msMatch) {
          const d = new Date(Number(msMatch[1]));
          if (isValid(d)) return d;
        }

        // ISO8601 pattern (YYYY-MM-DD or T)
        if (/^\d{4}-\d{2}-\d{2}/.test(val) || /T\d{2}:\d{2}:\d{2}/.test(val)) {
          try {
            const d = parseISO(val);
            if (isValid(d)) return d;
          } catch (e) {
            // ignore
          }
        }

        if (/^-?\d+$/.test(val)) {
          const d = new Date(Number(val));
          if (isValid(d)) return d;
        }
      }
      return val;
    },
  };
});
