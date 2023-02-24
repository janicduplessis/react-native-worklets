"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useSharedValue = useSharedValue;
var _react = require("react");
/**
 * Create a Shared Value that persists between re-renders.
 * @param initialValue The initial value for this Shared Value
 * @returns The Shared Value instance
 */
function useSharedValue(initialValue) {
  const ref = (0, _react.useRef)();
  if (ref.current == null) {
    ref.current = Worklets.createSharedValue(initialValue);
  }
  return ref.current;
}
//# sourceMappingURL=useSharedValue.js.map