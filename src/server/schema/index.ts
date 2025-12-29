import z from "zod";

export const analyzeInpIssuesInputSchema = z
  .object({
    diff: z
      .string()
      .optional()
      .describe(
        'Git diff specification (e.g., "main..HEAD", "HEAD~1..HEAD"). Analyzes only changed .ts/.tsx files between the specified refs.'
      ),
    files: z
      .array(z.string())
      .optional()
      .describe(
        'Comma-separated list of specific file paths to analyze (e.g., ["src/App.tsx", "src/Button.tsx"])'
      ),
    repoPath: z
      .string()
      .optional()
      .describe("Path to the repository root (defaults to current working directory)"),
  })
  .refine((data) => data.diff || (data.files && data.files.length > 0), {
    message: "Either 'diff' or 'files' must be provided",
  });
