import { DependencyList } from "react";
/**
 * Create a Worklet function that persists between re-renders.
 * @param callback The Worklet. Must be marked with the `'worklet'` directive.
 * @param dependencyList The React dependencies of this Worklet.
 * @returns A memoized Worklet
 */
export declare function useWorklet<TResult, TArguments extends [], T extends (...args: TArguments) => TResult>(callback: T, dependencyList: DependencyList): (...args: TArguments) => Promise<TResult>;
//# sourceMappingURL=useWorklet.d.ts.map