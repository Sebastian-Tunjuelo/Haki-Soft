#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallbackServer } from "./callback-server.js";
import { loadConfig } from "./config.js";
import { OpenPaymentsService } from "./open-payments-service.js";
import { SessionStore } from "./session-store.js";
import { registerTools } from "./tools.js";

async function main(): Promise<void> {
  console.error("open-payments-mcp starting");
  const config = loadConfig();
  const store = new SessionStore(config.sessionFile);
  const callbackServer = new CallbackServer(store, config.callbackPort);
  const service = new OpenPaymentsService(config, store, callbackServer);

  const server = new McpServer({
    name: "open-payments-mcp",
    version: "0.1.0",
  });

  registerTools(server, service);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("open-payments-mcp connected (stdio transport)");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  process.stderr.write(`open-payments-mcp failed to start: ${message}\n`);
  process.exit(1);
});
