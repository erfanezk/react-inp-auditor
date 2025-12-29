import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "@/utils/logger";
import { createServer } from "./config";
import { tools } from "./tools";

const server = createServer();

// Register all tools
for (const tool of tools) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.inputSchema,
    },
    tool.handler
  );
}

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Frontend Performance Auditor MCP Server running on stdio");
}

main().catch((error) => {
  logger.fatal("Fatal error in main():", error);
  process.exit(1);
});
