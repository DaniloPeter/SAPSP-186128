sap.ui.define(["sap/ui/core/ComponentContainer"], (ComponentContainer) => {
  "use strict";

  new ComponentContainer({
    name: "ui5.testapp",
    settings: {
      id: "testapp",
    },
    async: true,
  }).placeAt("content");
});
