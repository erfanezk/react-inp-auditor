import ts from "typescript";
import type { PerformanceIssue, Rule } from "@/types";
import { PerformanceMetric, RuleName, Severity } from "@/types";

function isUseEffectCall(node: ts.Node): boolean {
  if (!ts.isCallExpression(node)) return false;
  const expression = node.expression;
  if (ts.isIdentifier(expression)) {
    return expression.text === "useEffect";
  }
  return false;
}

function hasCleanupReturn(node: ts.Node): boolean {
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const body = node.body;
    if (ts.isBlock(body)) {
      for (const statement of body.statements) {
        if (ts.isReturnStatement(statement) && statement.expression) {
          return true;
        }
      }
    } else if (ts.isCallExpression(body) || ts.isArrowFunction(body)) {
      return true;
    }
  }
  return false;
}

function hasEventListenerOrInterval(node: ts.Node): boolean {
  let found = false;

  function visit(n: ts.Node) {
    if (ts.isCallExpression(n)) {
      const expression = n.expression;
      if (ts.isPropertyAccessExpression(expression)) {
        const name = expression.name.text;
        if (name === "addEventListener" || name === "setInterval" || name === "setTimeout") {
          found = true;
          return;
        }
      }
      if (ts.isIdentifier(expression)) {
        const name = expression.text;
        if (name === "setInterval" || name === "setTimeout") {
          found = true;
          return;
        }
      }
    }
    ts.forEachChild(n, visit);
  }

  visit(node);
  return found;
}

function findUseEffectHooks(sourceFile: ts.SourceFile): ts.CallExpression[] {
  const hooks: ts.CallExpression[] = [];

  function visit(node: ts.Node) {
    if (isUseEffectCall(node)) {
      hooks.push(node as ts.CallExpression);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return hooks;
}

export const memoryCleanupRule: Rule = {
  config: {
    name: RuleName.MemoryCleanup,
    description:
      "Detects useEffect hooks with event listeners or intervals that lack cleanup functions",
    metric: PerformanceMetric.Memory,
    defaultSeverity: Severity.High,
  },
  detect: (filePath: string, sourceFile: ts.SourceFile): PerformanceIssue[] => {
    const issues: PerformanceIssue[] = [];

    const useEffectHooks = findUseEffectHooks(sourceFile);

    for (const hook of useEffectHooks) {
      if (hook.arguments.length === 0) continue;

      const callback = hook.arguments[0];
      if (!callback) continue;

      const hasListenerOrInterval = hasEventListenerOrInterval(callback);

      if (hasListenerOrInterval && !hasCleanupReturn(callback)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(hook.getStart());
        const codeSnippet = sourceFile.text.substring(hook.getStart(), hook.getEnd());

        issues.push({
          metric: PerformanceMetric.Memory,
          severity: Severity.High,
          file: filePath,
          line: line + 1,
          column: sourceFile.getLineAndCharacterOfPosition(hook.getStart()).character + 1,
          explanation:
            "useEffect hook contains addEventListener, setInterval, or setTimeout but lacks a cleanup function. This can cause memory leaks.",
          fix: "Add a return statement in useEffect that removes the event listener or clears the interval/timeout.",
          rule: RuleName.MemoryCleanup,
          codeSnippet: codeSnippet.substring(0, 200),
        });
      }
    }

    return issues;
  },
};
