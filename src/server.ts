/**
 * MCP Server setup and request handlers
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { tools, toolHandlers } from "./tools/index.js";

// Create server instance
export const server = new Server(
  {
    name: "astro-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const handler = toolHandlers[name];

    if (!handler) {
      throw new Error(
        `Unknown tool: ${name}. Available tools are: ${Object.keys(toolHandlers).join(", ")}`
      );
    }

    return await handler(args);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      return {
        content: [
          {
            type: "text",
            text: `Input validation error:\n${issues}\n\nPlease check the input parameters and try again.`,
          },
        ],
        isError: true,
      };
    }

    if (error instanceof Error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `An unexpected error occurred. Please check your input and try again.`,
        },
      ],
      isError: true,
    };
  }
});
