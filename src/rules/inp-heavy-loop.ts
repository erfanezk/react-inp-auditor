import ts from "typescript";
import type { PerformanceIssue, Rule } from "@/types";
import { PerformanceMetric, RuleName, Severity } from "@/types";
import { findEventHandlers } from "@/utils/event-handler";
import { getFunctionBody, isLoop } from "@/utils/functions";

const MAX_SAFE_ITERATIONS = 10;

function countLoopIterations(node: ts.ForStatement): number {
  const condition = node.condition;
  if (!condition || !ts.isBinaryExpression(condition)) return 0;

  if (ts.isIdentifier(condition.left) && ts.isNumericLiteral(condition.right)) {
    const max = parseInt(condition.right.text, 10);
    const operator = condition.operatorToken.kind;

    if (operator === ts.SyntaxKind.LessThanToken) return max;
    if (operator === ts.SyntaxKind.LessThanEqualsToken) return max + 1;
  }

  return 0;
}

function hasNestedLoops(node: ts.Node): boolean {
  let foundLoop = false;

  function visit(child: ts.Node): boolean {
    if (isLoop(child)) {
      if (foundLoop) return true;
      foundLoop = true;
    }
    return ts.forEachChild(child, visit) === false;
  }

  return ts.forEachChild(node, visit) === false;
}

function findLoopsInNode(node: ts.Node): ts.Node[] {
  const loops: ts.Node[] = [];

  function visit(child: ts.Node) {
    if (isLoop(child)) {
      loops.push(child);
    }
    ts.forEachChild(child, visit);
  }

  ts.forEachChild(node, visit);
  return loops;
}

export const inpHeavyLoopsRule: Rule = {
  config: {
    name: RuleName.InpHeavyLoops,
    description: "Detects heavy loops inside event handlers that can cause INP issues",
    metric: PerformanceMetric.Inp,
    defaultSeverity: Severity.High,
  },
  detect: (filePath: string, sourceFile: ts.SourceFile): PerformanceIssue[] => {
    const issues: PerformanceIssue[] = [];
    const eventHandlers = findEventHandlers(sourceFile);

    for (const handler of eventHandlers) {
      const body = getFunctionBody(handler);
      if (!body) continue;

      const loops = findLoopsInNode(body);

      for (const loop of loops) {
        const iterations = ts.isForStatement(loop) ? countLoopIterations(loop) : 0;
        const hasNested = hasNestedLoops(loop);

        if (iterations > MAX_SAFE_ITERATIONS || hasNested) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(loop.getStart());
          const codeSnippet = sourceFile.text.substring(loop.getStart(), loop.getEnd());

          const explanation = [
            "Heavy loop detected in event handler.",
            iterations > MAX_SAFE_ITERATIONS && `Loop iterates ${iterations} times.`,
            hasNested && "Nested loops detected.",
            "This can block the main thread and cause poor INP (Interaction to Next Paint).",
          ]
            .filter(Boolean)
            .join(" ");

          issues.push({
            metric: PerformanceMetric.Inp,
            severity: Severity.High,
            file: filePath,
            line: line + 1,
            column: character + 1,
            explanation,
            fix: "Move heavy computation outside the event handler. Use requestIdleCallback, Web Workers, or debounce/throttle the handler.",
            rule: RuleName.InpHeavyLoops,
            codeSnippet: codeSnippet.substring(0, 200),
          });
        }
      }
    }

    return issues;
  },
};
