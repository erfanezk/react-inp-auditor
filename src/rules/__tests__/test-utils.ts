import { expect } from "vitest";
import type { PerformanceIssue, Rule } from "@/types";
import { PerformanceMetric, Severity } from "@/types";
import { createSourceFile } from "@/utils/test-helpers";

/**
 * Generic helper to detect issues using any rule
 */
export function detectIssues(
  rule: Rule,
  code: string,
  fileName: string = "test.tsx"
): PerformanceIssue[] {
  const sourceFile = createSourceFile(code, fileName);
  return rule.detect(fileName, sourceFile);
}

/**
 * Generic helper to validate issue structure
 */
export function expectIssue(
  issue: PerformanceIssue,
  expectedRule: string,
  expectedMetric: PerformanceMetric = PerformanceMetric.Inp,
  expectedSeverity: Severity = Severity.High
): void {
  expect(issue.metric).toBe(expectedMetric);
  expect(issue.severity).toBe(expectedSeverity);
  expect(issue.rule).toBe(expectedRule);
  expect(issue.file).toBeTruthy();
  expect(issue.explanation).toBeDefined();
  expect(issue.fix).toBeDefined();
  expect(issue.line).toBeGreaterThan(0);
  expect(issue.column).toBeGreaterThan(0);
  expect(issue.codeSnippet).toBeDefined();
  expect(issue.codeSnippet?.length).toBeGreaterThan(0);
}

/**
 * Helper to assert no issues were detected
 */
export function expectNoIssues(issues: PerformanceIssue[]): void {
  expect(issues).toHaveLength(0);
}

/**
 * Helper to assert issues were detected with validation
 */
export function expectIssuesDetected(
  issues: PerformanceIssue[],
  expectedRule: string,
  minCount: number = 1,
  expectedMetric: PerformanceMetric = PerformanceMetric.Inp,
  expectedSeverity: Severity = Severity.High
): void {
  expect(issues.length).toBeGreaterThanOrEqual(minCount);
  for (const issue of issues) {
    expectIssue(issue, expectedRule, expectedMetric, expectedSeverity);
  }
}
