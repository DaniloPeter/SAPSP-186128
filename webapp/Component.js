sap.ui.define(
  ["sap/ui/core/UIComponent", "sap/ui/Device", "./model/ErrorHandler"],
  (UIComponent, Device, ErrorHandler) => {
    "use strict";

    return UIComponent.extend("com.segezha.form.roll.conversion.Component", {
      metadata: {
        manifest: "json",
      },

      init() {
        UIComponent.prototype.init.apply(this, arguments);
        this.getRouter().initialize();
        new ErrorHandler(this);
      },

      getContentDensityClass: function () {
        if (this._sContentDensityClass === undefined) {
          // check whether FLP has already set the content density class; do nothing in this case
          if (
            document.body.classList.contains("sapUiSizeCozy") ||
            document.body.classList.contains("sapUiSizeCompact")
          ) {
            if (document.body.classList.contains("sapUiSizeCozy") === true) {
              this._sContentDensityClass = "sapUiSizeCozy";
            } else if (
              document.body.classList.contains("sapUiSizeCompact") === true
            ) {
              this._sContentDensityClass = "sapUiSizeCompact";
            } else {
              this._sContentDensityClass = "";
            }
          } else if (!Device.support.touch) {
            // apply "compact" mode if touch is not supported
            this._sContentDensityClass = "sapUiSizeCompact";
          } else {
            // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
            this._sContentDensityClass = "sapUiSizeCozy";
          }
        }
        return this._sContentDensityClass;
      },
    });
  }
);
