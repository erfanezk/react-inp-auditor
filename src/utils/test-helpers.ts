import type { SourceFile } from "typescript";
import ts from "typescript";

/**
 * Creates a TypeScript SourceFile from a code string for testing purposes.
 *
 * @param code - TypeScript/TSX code string to parse
 * @param fileName - Optional file name (defaults to 'test.tsx')
 * @returns A TypeScript SourceFile object
 */
export function createSourceFile(code: string, fileName: string = "test.tsx"): SourceFile {
  const scriptKind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;

  return ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, scriptKind);
}
