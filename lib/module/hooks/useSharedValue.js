import { useRef } from "react";
/**
 * Create a Shared Value that persists between re-renders.
 * @param initialValue The initial value for this Shared Value
 * @returns The Shared Value instance
 */
export function useSharedValue(initialValue) {
  const ref = useRef();
  if (ref.current == null) {
    ref.current = Worklets.createSharedValue(initialValue);
  }
  return ref.current;
}
//# sourceMappingURL=useSharedValue.js.map