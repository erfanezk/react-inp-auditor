import type { SourceFile } from "typescript";
import type { PerformanceIssue } from "@/types";
import { PerformanceMetric, type RuleName, Severity } from "@/types";

interface IssueCreationConfig {
  explanation: string;
  fix: string;
  severity?: Severity;
  metric?: PerformanceMetric;
}

export function createPerformanceIssue(
  sourceFile: SourceFile,
  filePath: string,
  rule: RuleName,
  config: IssueCreationConfig,
  node: { start: number; end: number }
): PerformanceIssue {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.start);

  return {
    metric: config.metric || PerformanceMetric.Inp,
    severity: config.severity || Severity.Medium,
    file: filePath,
    line: line + 1,
    column: character + 1,
    explanation: config.explanation,
    fix: config.fix,
    rule,
    codeSnippet: sourceFile.text.substring(node.start, node.end).substring(0, 200),
  };
}

// Helper for creating issues from AST nodes
export function createIssueFromNode(
  sourceFile: SourceFile,
  filePath: string,
  rule: RuleName,
  config: IssueCreationConfig,
  node: { getStart(): number; getEnd(): number }
): PerformanceIssue {
  return createPerformanceIssue(sourceFile, filePath, rule, config, {
    start: node.getStart(),
    end: node.getEnd(),
  });
}

// Pre-configured issue templates for common patterns
export const issueTemplates = {
  heavyComputation: (operationCount: number) =>
    `/Function performs ${operationCount} sequential operations which could exceed 50ms and create a long task, blocking the main thread and causing poor INP.`,

  layoutThrashing: (patternType: string) =>
    `/Layout thrashing detected: ${patternType}. This forces synchronous layout recalculations, blocking the main thread and causing poor INP.`,

  missingYielding: (context: string) =>
    `${context} without yielding to the main thread. This can block rendering and cause poor INP.`,

  animationPerformance: (properties: string[]) =>
    `/Non-composited CSS properties (${properties.join(", ")}) detected in animations. Causes layout thrashing and blocks main thread.`,
};
