import type { SourceFile } from "typescript";
import type { PerformanceIssue, PerformanceMetric } from "./performance.types";
import type { Severity } from "./severity.types";

export enum RuleName {
  InpCallbackYield = "inp-callback-yield",
  InpLayoutThrashing = "inp-layout-thrashing",
  InpDomSize = "inp-dom-size",
  // Long task focused rules
  InpLongLoop = "inp-long-loop",
  InpAsyncBatchProcessing = "inp-async-batch-processing",
  InpHeavyComputation = "inp-heavy-computation",
  // Event handler focused rules
  InpEventHandlerApiCalls = "inp-event-handler-api-calls",
  InpEventHandlerDomManipulation = "inp-event-handler-dom-manipulation",
  InpEventHandlerStateUpdates = "inp-event-handler-state-updates",
  // Animation focused rules
  InpAnimationType = "inp-animation-type",
  InpAnimationCompositing = "inp-animation-compositing",
}

export type RuleDetector = (filePath: string, sourceFile: SourceFile) => PerformanceIssue[];

export interface RuleConfig {
  name: RuleName;
  description: string;
  metric: PerformanceMetric;
  defaultSeverity: Severity;
  enabled?: boolean;
  thresholds?: Partial<{
    minOperations: number;
    maxNesting: number;
    minStateUpdates: number;
    loopOperationsThreshold: number;
  }>;
}

export interface Rule {
  config: RuleConfig;
  detect: RuleDetector;
}
