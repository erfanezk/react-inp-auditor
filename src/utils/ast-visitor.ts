import ts from "typescript";
import { getCallExpressionName } from "./functions";

export type Visitor<T = void> = (node: ts.Node, sourceFile: ts.SourceFile) => T | null;

export function visitCallExpressions(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  visitor: (callName: string, node: ts.CallExpression) => void
): void {
  if (ts.isCallExpression(node)) {
    const callName = getCallExpressionName(node, sourceFile);
    if (callName) visitor(callName, node);
  }
  ts.forEachChild(node, (child) => visitCallExpressions(child, sourceFile, visitor));
}

export function visitPropertyAccess(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  visitor: (propertyName: string, node: ts.PropertyAccessExpression) => void
): void {
  if (ts.isPropertyAccessExpression(node)) {
    const propertyName = node.name.getText(sourceFile);
    visitor(propertyName, node);
  }
  ts.forEachChild(node, (child) => visitPropertyAccess(child, sourceFile, visitor));
}

export function visitFunctionNodes(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  visitor: (functionNode: ts.FunctionLikeDeclaration) => void
): void {
  if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
    visitor(node);
  }
  ts.forEachChild(node, (child) => visitFunctionNodes(child, sourceFile, visitor));
}

export function visitLoops(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  visitor: (loopNode: ts.IterationStatement) => void
): void {
  if (
    ts.isForStatement(node) ||
    ts.isForOfStatement(node) ||
    ts.isForInStatement(node) ||
    ts.isWhileStatement(node) ||
    ts.isDoStatement(node)
  ) {
    visitor(node);
  }
  ts.forEachChild(node, (child) => visitLoops(child, sourceFile, visitor));
}

export function findFirstMatchingNode<T extends ts.Node>(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  predicate: (node: ts.Node, sourceFile: ts.SourceFile) => boolean
): T | null {
  if (predicate(node, sourceFile)) {
    return node as T;
  }

  let result: T | null = null;
  ts.forEachChild(node, (child) => {
    if (!result) {
      result = findFirstMatchingNode(child, sourceFile, predicate);
    }
  });

  return result;
}

export function collectMatchingNodes<T extends ts.Node>(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  predicate: (node: ts.Node, sourceFile: ts.SourceFile) => boolean,
  results: T[] = []
): T[] {
  if (predicate(node, sourceFile)) {
    results.push(node as T);
  }

  ts.forEachChild(node, (child) => {
    collectMatchingNodes(child, sourceFile, predicate, results);
  });

  return results;
}

export function earlyExitVisit<T>(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  predicate: (node: ts.Node, sourceFile: ts.SourceFile) => T | null
): T | null {
  const result = predicate(node, sourceFile);
  if (result !== null) {
    return result;
  }

  let foundResult: T | null = null;
  ts.forEachChild(node, (child) => {
    if (!foundResult) {
      foundResult = earlyExitVisit(child, sourceFile, predicate);
    }
  });

  return foundResult;
}
