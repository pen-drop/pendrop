#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { composePipeline } from "./composerEngine.js";
import { initLogger } from "./utils/mcpLogger.js";

const server = new Server(
  {
    name: "pendrop-composer",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize logger
initLogger({
  logToFile: false, // Default to false for now unless configured
  logToConsole: true
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "compose_pipeline",
        description: "Compose an AI instruction prompt from a pipeline configuration in pendrop.yml",
        inputSchema: {
          type: "object",
          properties: {
            pipeline: {
              type: "string",
              description: "Name of the pipeline as configured in pendrop.yml"
            },
            step: {
              anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } }
              ],
              description: "Optional: Specific step ID(s) to run (includes dependencies)"
            },
            project_path: {
              type: "string",
              description: "Path to the project root containing pendrop.yml"
            },
            variables: {
              type: "object",
              description: "Additional variables for template substitution (overrides config)"
            }
          },
          required: ["pipeline", "project_path"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "compose_pipeline") {
    const schema = z.object({
      pipeline: z.string(), // Was recipe, now pipeline
      step: z.union([z.string(), z.array(z.string())]).optional(),
      project_path: z.string(),
      variables: z.record(z.any()).optional()
    });

    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      throw new Error(`Invalid arguments: ${parsed.error.message}`);
    }

    try {
      const result = await composePipeline(parsed.data);
      return {
        content: [
          {
            type: "text",
            text: result.instructions
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error composing pipeline: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

  throw new Error(`Tool not found: ${name}`);
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Pendrop Composer MCP server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
