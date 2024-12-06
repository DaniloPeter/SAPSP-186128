sap.ui.define([], () => {
  "use strict";

  return {
    calculateOverprints(printMeters, reportLength) {
      if (!printMeters || !reportLength) return 0;
      return (printMeters / (reportLength * 0.01)).toFixed(2);
    },

    toggleWeight(weight, defect) {
      const isDefect = weight > 50;
      debugger;
      // TODO: не понял как передать в модель состояние
      // switch не работает правильно, если его переключать отдельно
    },
  };
});
