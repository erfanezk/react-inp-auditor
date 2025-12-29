import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const SERVER_INFO = {
  name: "frontend-performance-auditor",
  version: "1.0.0",
} as const;

export const SERVER_CAPABILITIES = {
  capabilities: {
    tools: {},
  },
} as const;

export function createServer(): McpServer {
  return new McpServer(SERVER_INFO, SERVER_CAPABILITIES);
}
