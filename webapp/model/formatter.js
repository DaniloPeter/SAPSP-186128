sap.ui.define([], () => {
  "use strict";

  return {
    calculateOverprints(meters, reportLength) {
      debugger;
      if (!meters || !reportLength) return 0;
      return (meters / (reportLength * 0.01)).toFixed(2);
    },
  };
});
