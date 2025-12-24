import type ts from "typescript";
import { API_CALL_PATTERNS } from "@/constants/api-call";
import type { PerformanceIssue, Rule } from "@/types";
import { PerformanceMetric, RuleName, Severity } from "@/types";
import { earlyExitVisit } from "@/utils/ast-visitor";
import { findEventHandlers } from "@/utils/event-handler";
import { getCallExpressionName, matchesPattern } from "@/utils/functions";
import { createIssueFromNode } from "@/utils/issue-factory";
import { skipIfHasYielding } from "@/utils/rule-filters";
import { safeGetFunctionBody } from "@/utils/safe-functions";

function hasApiCall(body: ts.Node, sourceFile: ts.SourceFile): boolean {
  return (
    earlyExitVisit(body, sourceFile, (node, sf) => {
      const callName = getCallExpressionName(node, sf);
      return callName && matchesPattern(callName, API_CALL_PATTERNS) ? true : null;
    }) ?? false
  );
}

function createApiCallIssue(
  filePath: string,
  sourceFile: ts.SourceFile,
  handler: ts.Node
): PerformanceIssue {
  return createIssueFromNode(
    sourceFile,
    filePath,
    RuleName.InpEventHandlerApiCalls,
    {
      explanation:
        "Event handler performs API calls without yielding to the main thread. This can block rendering and cause poor INP (Interaction to Next Paint).",
      fix: "Defer API calls using setTimeout or requestIdleCallback.",
      severity: Severity.High,
    },
    handler
  );
}

export const inpEventHandlerApiCallsRule: Rule = {
  config: {
    name: RuleName.InpEventHandlerApiCalls,
    description:
      "Detects event handlers that perform API calls without yielding to the main thread",
    metric: PerformanceMetric.Inp,
    defaultSeverity: Severity.High,
  },
  detect: (filePath: string, sourceFile: ts.SourceFile): PerformanceIssue[] => {
    const issues: PerformanceIssue[] = [];
    const eventHandlers = findEventHandlers(sourceFile);

    for (const handler of eventHandlers) {
      const body = safeGetFunctionBody(handler);
      if (!body) continue;

      // Only flag if handler has API calls
      if (!hasApiCall(body, sourceFile)) {
        continue;
      }

      // Only flag if handler doesn't yield
      const yieldingFilter = skipIfHasYielding(body, sourceFile);
      if (yieldingFilter.shouldSkip) continue;

      const issue = createApiCallIssue(filePath, sourceFile, handler);
      issues.push(issue);
    }

    return issues;
  },
};
