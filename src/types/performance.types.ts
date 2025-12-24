import type { RuleName } from "./rules.types";
import type { Severity } from "./severity.types";

export enum PerformanceMetric {
  Inp = "INP",
}

interface BasePerformanceIssue {
  metric: PerformanceMetric;
  severity: Severity;
  file: string;
  line: number;
  column?: number;
  explanation: string;
  fix: string;
  rule: RuleName;
  codeSnippet?: string;
}

export interface PerformanceIssue extends BasePerformanceIssue {
  details?: Record<string, any>;
}

export interface LayoutThrashingIssue extends BasePerformanceIssue {
  pattern: "read-after-write" | "read-write-loop" | "alternating";
  operations: any[];
}

export interface HeavyComputationIssue extends BasePerformanceIssue {
  operationCount: number;
  estimatedDuration?: number;
}

export interface AnimationPerformanceIssue extends BasePerformanceIssue {
  nonCompositedProperties: string[];
}

export interface StateUpdateIssue extends BasePerformanceIssue {
  updateCount: number;
}
