import type { z } from "zod";
import { analyze } from "@/engine/analyzer";
import { generateMarkdownReport } from "@/report/markdown";
import { analyzeInpIssuesInputSchema } from "../schema";

type AnalyzeInpIssuesInput = z.infer<typeof analyzeInpIssuesInputSchema>;

export async function handleAnalyzeInpIssues(input: AnalyzeInpIssuesInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}> {
  try {
    const { diff, files, repoPath } = input;
    const options = {
      diff,
      files,
    };

    const result = await analyze(options, repoPath);
    const markdown = generateMarkdownReport(result);

    return {
      content: [
        {
          type: "text",
          text: markdown,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error analyzing code: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

export const analyzeInpIssuesTool = {
  name: "analyze-inp-issues",
  description:
    "Analyze frontend TypeScript/React code for INP (Interaction to Next Paint) performance issues. Analyzes changed files via Git diff or specific file paths.",
  inputSchema: analyzeInpIssuesInputSchema,
  handler: handleAnalyzeInpIssues,
};
