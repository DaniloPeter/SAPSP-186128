sap.ui.define([], () => {
  "use strict";

  return {
    formatSwitchDefectEnabled(sDisruptWeight) {
      const iDisruptWeight = +sDisruptWeight;
      return iDisruptWeight <= 50;
    },

    formatLabelWithBrackets(sValue) {
      if (!sValue) {
        return "";
      }
      return `(${sValue})`;
    },

    formatValueState(bError, sFormat) {
      if (!bError) {
        return "";
      }
      if (sFormat) {
        return sFormat;
      }
      return "Недействительный ввод";
    },
  };
});
