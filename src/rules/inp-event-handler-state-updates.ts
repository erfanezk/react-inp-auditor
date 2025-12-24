import type ts from "typescript";
import type { PerformanceIssue, Rule } from "@/types";
import { PerformanceMetric, RuleName, Severity } from "@/types";
import { earlyExitVisit } from "@/utils/ast-visitor";
import { findEventHandlers } from "@/utils/event-handler";
import { getCallExpressionName } from "@/utils/functions";
import { createIssueFromNode } from "@/utils/issue-factory";
import { safeGetFunctionBody } from "@/utils/safe-functions";
import { hasYieldingMechanism } from "@/utils/yielding";

// Configurable threshold
const DEFAULT_MIN_STATE_UPDATES = 3;

function countStateUpdates(body: ts.Node, sourceFile: ts.SourceFile): number {
  let count = 0;

  earlyExitVisit(body, sourceFile, (node, sf) => {
    const callName = getCallExpressionName(node, sf);
    if (
      callName &&
      (callName.startsWith("set") || callName === "dispatch" || callName === "setState")
    ) {
      count++;
    }
    return null; // Continue traversal
  });

  return count;
}

function createStateUpdateIssue(
  filePath: string,
  sourceFile: ts.SourceFile,
  handler: ts.Node,
  updateCount: number
): PerformanceIssue {
  const explanation = `Event handler performs ${updateCount} state updates without yielding between them. Multiple synchronous state updates can cause multiple re-renders and block the main thread, leading to poor INP (Interaction to Next Paint).`;
  const fix =
    "Batch state updates or yield between them using requestAnimationFrame or setTimeout.";

  return createIssueFromNode(
    sourceFile,
    filePath,
    RuleName.InpEventHandlerStateUpdates,
    {
      explanation,
      fix,
      severity: Severity.Medium,
    },
    handler
  );
}

export const inpEventHandlerStateUpdatesRule: Rule = {
  config: {
    name: RuleName.InpEventHandlerStateUpdates,
    description:
      "Detects event handlers with excessive state updates that don't yield between updates",
    metric: PerformanceMetric.Inp,
    defaultSeverity: Severity.Medium,
  },
  detect: (filePath: string, sourceFile: ts.SourceFile): PerformanceIssue[] => {
    const issues: PerformanceIssue[] = [];
    const eventHandlers = findEventHandlers(sourceFile);

    for (const handler of eventHandlers) {
      const body = safeGetFunctionBody(handler);
      if (!body) continue;

      const updateCount = countStateUpdates(body, sourceFile);

      // Apply filters
      if (updateCount < DEFAULT_MIN_STATE_UPDATES) continue;

      if (hasYieldingMechanism(body, sourceFile, true)) continue;

      const issue = createStateUpdateIssue(filePath, sourceFile, handler, updateCount);
      issues.push(issue);
    }

    return issues;
  },
};
