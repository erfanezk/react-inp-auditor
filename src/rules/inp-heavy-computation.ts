import ts from "typescript";
import { YIELDING_MECHANISMS } from "@/constants/yielding";
import type { PerformanceIssue, Rule } from "@/types";
import { PerformanceMetric, RuleName, Severity } from "@/types";
import { visitCallExpressions } from "@/utils/ast-visitor";
import { findFunctions } from "@/utils/functions";
import { createIssueFromNode } from "@/utils/issue-factory";
import {
  skipIfBelowThreshold,
  skipIfEventHandler,
  skipIfHasYielding,
  skipIfLoopExists,
} from "@/utils/rule-filters";
import { safeGetFunctionBody } from "@/utils/safe-functions";

// Using rule config thresholds instead of hard-coded values
const DEFAULT_MIN_OPERATIONS = 20;
const DEFAULT_HIGH_OPERATIONS_THRESHOLD = 30;

function countOperations(node: ts.Node, sourceFile: ts.SourceFile): number {
  let count = 0;

  visitCallExpressions(node, sourceFile, (callName, callNode) => {
    // Skip yielding mechanisms
    const isYielding =
      YIELDING_MECHANISMS.some((name) => callName.includes(name)) ||
      (ts.isPropertyAccessExpression(callNode.expression) &&
        callNode.expression.name.getText(sourceFile) === "yield");

    if (!isYielding) {
      count++;
    }
  });

  return count;
}

function createHeavyComputationIssue(
  filePath: string,
  sourceFile: ts.SourceFile,
  functionNode: ts.Node,
  operationCount: number
): PerformanceIssue {
  const severity =
    operationCount > DEFAULT_HIGH_OPERATIONS_THRESHOLD ? Severity.High : Severity.Medium;
  const explanation = `Function performs ${operationCount} sequential operations which could exceed 50ms and create a long task, blocking the main thread and causing poor INP.`;
  const fix = "Break up the work into smaller chunks using scheduler.yield() or setTimeout.";

  return createIssueFromNode(
    sourceFile,
    filePath,
    RuleName.InpHeavyComputation,
    {
      explanation,
      fix,
      severity,
    },
    functionNode
  );
}

export const inpHeavyComputationRule: Rule = {
  config: {
    name: RuleName.InpHeavyComputation,
    description:
      "Detects functions with many sequential operations that could create long tasks (>50ms)",
    metric: PerformanceMetric.Inp,
    defaultSeverity: Severity.Medium,
  },
  detect: (filePath: string, sourceFile: ts.SourceFile): PerformanceIssue[] => {
    const issues: PerformanceIssue[] = [];
    const functions = findFunctions(sourceFile);

    for (const func of functions) {
      const body = safeGetFunctionBody(func);
      if (!body || ts.isExpression(body)) continue;

      // Apply rule filters
      const eventHandlerFilter = skipIfEventHandler(func, sourceFile);
      if (eventHandlerFilter.shouldSkip) continue;

      const loopFilter = skipIfLoopExists(body);
      if (loopFilter.shouldSkip) continue;

      const yieldingFilter = skipIfHasYielding(body, sourceFile);
      if (yieldingFilter.shouldSkip) continue;

      // Count operations using early exit for performance
      const operationCount = countOperations(body, sourceFile);

      const thresholdFilter = skipIfBelowThreshold(operationCount, DEFAULT_MIN_OPERATIONS);
      if (thresholdFilter.shouldSkip) continue;

      const issue = createHeavyComputationIssue(filePath, sourceFile, func, operationCount);
      issues.push(issue);
    }

    return issues;
  },
};
