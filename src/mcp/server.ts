import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MetaClient } from '../meta/client.js';
import { TOOL_DEFINITIONS, callTool } from './tools/index.js';

/**
 * Creates a fresh MCP Server scoped to one tenant's access token.
 * Called per-request so tokens are never shared across tenants.
 */
export function createMcpServer(accessToken: string): Server {
  const client = new MetaClient(accessToken);

  const server = new Server(
    { name: 'meta-marketing-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;
    return callTool(client, name, args as Record<string, unknown>);
  });

  return server;
}
