sap.ui.define([], function () {
  "use strict";

  return {
    calculateOverPrints(printMeters, reportLength) {
      const iPrintMeters = +printMeters,
        iReportLength = +reportLength;
      if (!iPrintMeters || !iReportLength) return 0;
      return (iPrintMeters / (iReportLength * 0.01)).toFixed(2);
    },
  };
});
