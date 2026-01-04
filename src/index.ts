#!/usr/bin/env node

/**
 * Astrology MCP Server - Entry Point
 *
 * A Model Context Protocol server for astrological calculations.
 * Provides tools for calculating natal charts and converting locations to coordinates.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./server.js";

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Astrology MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
