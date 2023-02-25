import { useCallback, useMemo } from "react";

/**
 * Create a Worklet function that persists between re-renders.
 * @param callback The Worklet. Must be marked with the `'worklet'` directive.
 * @param dependencyList The React dependencies of this Worklet.
 * @returns A memoized Worklet
 */
export function useWorklet(callback, dependencyList) {
  const worklet = useMemo(() => Worklets.createRunInContextFn(function () {
    "worklet";

    return callback(...arguments);
  }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  dependencyList);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(worklet, dependencyList);
}
//# sourceMappingURL=useWorklet.js.map