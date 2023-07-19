"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useWorklet = useWorklet;
var _react = require("react");
/**
 * Create a Worklet function that persists between re-renders.
 * @param callback The Worklet. Must be marked with the `'worklet'` directive.
 * @param dependencyList The React dependencies of this Worklet.
 * @returns A memoized Worklet
 */
function useWorklet(callback, dependencyList) {
  const worklet = (0, _react.useMemo)(() => Worklets.createRunInContextFn(function () {
    "worklet";

    return callback(...arguments);
  }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  dependencyList);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return (0, _react.useCallback)(worklet, dependencyList);
}
//# sourceMappingURL=useWorklet.js.map