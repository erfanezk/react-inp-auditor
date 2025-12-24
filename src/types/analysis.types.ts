import type { PerformanceIssue, PerformanceMetric } from "./performance.types";
import type { Severity } from "./severity.types";

export interface AnalysisResult {
  issues: PerformanceIssue[];
  summary: {
    total: number;
    bySeverity: Record<Severity, number>;
    byMetric: Record<PerformanceMetric, number>;
    filesAnalyzed: number;
  };
}

export interface AnalyzerOptions {
  diff?: string;
  files?: string[];
  failOnHighSeverity?: boolean;
  outputFormat?: "markdown";
}
