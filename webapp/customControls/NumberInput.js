sap.ui.define(
  ["sap/m/Input", "sap/ui/core/format/NumberFormat"],
  function (Input, NumberFormat) {
    return Input.extend(
      "com.segezha.form.roll.conversion.customControls.NumberInput",
      {
        metadata: {
          properties: {
            numericValue: {
              type: "string",
            },
            min: {
              type: "int",
              defaultValue: 0,
            },
            max: {
              type: "float",
            },
            maxIntegerDigits: {
              type: "int",
              defaultValue: 13,
            },
            maxFractionDigits: {
              type: "int",
              defaultValue: 3,
            },
          },
        },

        setProperty: function (sPropName, vValue) {
          const bPropChanged = this._propChanged(sPropName, vValue);
          Input.prototype.setProperty.apply(this, arguments);
          if (!bPropChanged) {
            return;
          }
          if (
            sPropName === "max" ||
            sPropName === "min" ||
            sPropName === "maxFractionDigits"
          ) {
            this.rebindingRequired = true;
          }
        },

        _propChanged: function (sPropName, vValue) {
          return this.getProperty(sPropName) === vValue;
        },

        setValue: function (value) {
          if (!value) {
            Input.prototype.setValue.call(this, value);
          } else {
            const maxFractionDigits = this.getMaxFractionDigits();
            const minFractionDigits = this.getMin();
            //For type INT
            const roundedValue = this._roundValue(value);
            //For type FLOAT
            const formattedValue = this._formatValue(roundedValue);
            if (minFractionDigits === maxFractionDigits) {
              Input.prototype.setValue.call(this, roundedValue);
            } else {
              Input.prototype.setValue.call(this, formattedValue);
            }
          }
        },

        _roundValue: function (value) {
          const maxFractionDigits = this.getMaxFractionDigits();
          const maxIntegerDigits = this.getMaxIntegerDigits();
          // Replaced space is ASCII code 160 non-breaking space !== ASCII code 32 space!
          // eslint-disable-next-line no-irregular-whitespace
          const sWithoutNonBreakingSpaces = value.replace(/ /g, "");

          // Replace usual ASCII code 32 spaces
          const sWithoutSpaces = sWithoutNonBreakingSpaces.replace(/ /g, "");
          const spaceSeparatedValue = sWithoutSpaces.replace(".", "");
          const dotSeparatedValue = spaceSeparatedValue.replace(",", ".");
          let roundedValue =
            parseFloat(dotSeparatedValue).toFixed(maxFractionDigits);
          if (isNaN(roundedValue)) {
            return "";
          }
          return dotSeparatedValue.slice(0, maxIntegerDigits);
        },

        _formatValue: function (value) {
          const maxFractionDigits = this.getMaxFractionDigits();
          const maxIntegerDigits = this.getMaxIntegerDigits();
          const minIntegerDigits = this.getMin();
          const oFormat = NumberFormat.getFloatInstance({
            maxIntegerDigits: maxIntegerDigits,
            minFractionDigits: maxFractionDigits,
            maxFractionDigits: maxFractionDigits,
          });
          const formattedValue = oFormat.format(value);
          if (
            formattedValue.includes("?") ||
            +value <= minIntegerDigits ||
            isNaN(value)
          ) {
            return oFormat.format("0");
          }
          return formattedValue;
        },

        setMaxFractionDigits: function (sMaxFractionDigits) {
          const iMaxFractionDigits = parseInt(sMaxFractionDigits, 10);
          if (!isNaN(iMaxFractionDigits)) {
            this.setProperty("maxFractionDigits", iMaxFractionDigits);
          }
        },

        onBeforeRendering: function () {
          this._checkAndBindValue();
        },

        _checkAndBindValue: function () {
          if (this._isReady()) {
            if (!this._alreadyBound()) {
              this._bindValue();
            }
          }
        },

        _alreadyBound: function () {
          if (this.rebindingRequired) {
            return false;
          }
          const bHasValueBinding = !!this.getBinding("value");
          return bHasValueBinding;
        },

        _isReady: function () {
          const bNumericValueBindingExist = !!this.getBinding("numericValue");
          return bNumericValueBindingExist;
        },

        _bindValue: function () {
          const sPath = this.getBinding("numericValue").getPath();
          const oConstraints = this._getConstraints();
          const oBindingParams = {
            path: sPath,
            type: "sap.ui.model.type.Float",
            formatOptions: {
              parseAsString: true,
            },
            constraints: oConstraints,
          };
          this.bindProperty("value", oBindingParams);
          this.rebindingRequired = false;
        },

        _getConstraints: function () {
          const oConstraints = {};
          this._appendMinConstraint(oConstraints);
          this._appendMaxConstraint(oConstraints);
          return oConstraints;
        },
        _appendMinConstraint: function (oConstraints) {
          const nMin = this.getMin();
          const bHasMin = Number.isFinite(nMin);
          if (bHasMin) {
            oConstraints.minimum = nMin;
          }
        },

        _appendMaxConstraint: function (oConstraints) {
          const nMax = this.getMax();
          const bHasMax = Number.isFinite(nMax);
          if (bHasMax) {
            oConstraints.maximum = nMax;
          }
        },

        renderer: "sap.m.InputRenderer",
      }
    );
  }
);
