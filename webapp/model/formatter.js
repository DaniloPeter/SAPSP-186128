sap.ui.define([], () => {
  "use strict";

  return {
    formatSwitchDefectEnabled(sDisruptWeight) {
      //TODO эта функция нам необходима, чтобы определить состояние свитча
      const iDisruptWeight = +sDisruptWeight;
      return iDisruptWeight <= 50;
    },
  };
});
