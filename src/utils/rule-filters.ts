import ts from "typescript";
import { findEventHandlers } from "./event-handler";
import { isLoop } from "./loop";
import { hasYieldingMechanism } from "./yielding";

export interface RuleFilterResult<T = boolean> {
  shouldSkip: T;
  reason?: string;
}

// Filter utilities that can be composed
export function skipIfHasYielding(body: ts.Node, sourceFile: ts.SourceFile): RuleFilterResult {
  const hasYielding = hasYieldingMechanism(body, sourceFile, true);
  return {
    shouldSkip: hasYielding,
    reason: hasYielding ? "Function already has yielding mechanism" : undefined,
  };
}

export function skipIfEventHandler(func: ts.Node, sourceFile: ts.SourceFile): RuleFilterResult {
  const eventHandlers = findEventHandlers(sourceFile);
  const isHandler = eventHandlers.some((handler) => handler === func);
  return {
    shouldSkip: isHandler,
    reason: isHandler ? "Function is an event handler" : undefined,
  };
}

export function skipIfLoopExists(body: ts.Node): RuleFilterResult {
  let hasLoop = false;

  function visit(node: ts.Node) {
    if (isLoop(node)) {
      hasLoop = true;
      return;
    }
    if (!hasLoop) {
      ts.forEachChild(node, visit);
    }
  }

  visit(body);
  return {
    shouldSkip: hasLoop,
    reason: hasLoop ? "Function contains loops" : undefined,
  };
}

export function skipIfBelowThreshold<T>(
  value: T | null | undefined,
  threshold: T,
  comparator: (a: T, b: T) => boolean = (a, b) => a < b
): RuleFilterResult<T> {
  const shouldSkip = value !== null && value !== undefined && comparator(value, threshold);
  return {
    shouldSkip: shouldSkip as T,
    reason: shouldSkip ? `Value below threshold: ${value} < ${threshold}` : undefined,
  };
}

export function skipIfAboveThreshold<T>(
  value: T,
  threshold: T,
  comparator: (a: T, b: T) => boolean = (a, b) => a > b
): RuleFilterResult<T> {
  const shouldSkip = comparator(value, threshold);
  return {
    shouldSkip: shouldSkip as T,
    reason: shouldSkip ? `Value above threshold: ${value} > ${threshold}` : undefined,
  };
}

// Composed filters for common patterns
export function createHeavyComputationFilter(threshold: number) {
  return (operationCount: number) =>
    skipIfBelowThreshold(operationCount, threshold, (a, b) => a < b);
}

export function createStateUpdatesFilter(threshold: number) {
  return (updateCount: number) => skipIfBelowThreshold(updateCount, threshold, (a, b) => a < b);
}

// Chain multiple filters
export function chainFilters<T = boolean>(
  ...filters: Array<() => RuleFilterResult<T>>
): RuleFilterResult<T> {
  for (const filter of filters) {
    const result = filter();
    if (result.shouldSkip) {
      return result;
    }
  }
  return { shouldSkip: false as T };
}
