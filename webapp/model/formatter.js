sap.ui.define([], () => {
  "use strict";

  return {
    formatSwitchDefectEnabled(sDisruptWeight) {
      const iDisruptWeight = +sDisruptWeight;
      return iDisruptWeight <= 50;
    },
  };
});
