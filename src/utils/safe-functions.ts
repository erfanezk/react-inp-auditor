import ts from "typescript";
import { getFunctionBody as originalGetFunctionBody } from "./functions";

export function safeGetFunctionBody(handler: ts.Node): ts.Node | null {
  try {
    return originalGetFunctionBody(handler);
  } catch (error) {
    console.warn(`Could not get function body for rule detection`, error);
    return null;
  }
}

export function safeGetCallExpressionName(node: ts.Node, sourceFile: ts.SourceFile): string | null {
  try {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isIdentifier(expression)) {
        return expression.text;
      }
      if (ts.isPropertyAccessExpression(expression)) {
        return expression.name.text;
      }
    }
    return null;
  } catch (error) {
    console.warn(`Error getting call expression name`, error);
    return null;
  }
}

export function safeGetLineAndCharacter(sourceFile: ts.SourceFile, position: number) {
  try {
    return sourceFile.getLineAndCharacterOfPosition(position);
  } catch (error) {
    console.warn(`Error getting position from source file`, error);
    return { line: 0, character: 0 };
  }
}
