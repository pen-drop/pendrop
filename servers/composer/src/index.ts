#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { runWorkflow } from "./composerEngine.js";
import { initLogger } from "./utils/mcpLogger.js";
import { loadMergedConfig } from "./utils/configLoader.js";
import { extractAsset, saveAsset } from "./utils/assetManager.js";

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
  logToFile: false,
  logToConsole: true
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "compose_workflow",
        description: "Compose an AI instruction prompt from a workflow configuration in pendrop.yml",
        inputSchema: {
          type: "object",
          properties: {
            workflow: {
              type: "string",
              description: "Name of the workflow as configured in pendrop.yml"
            },
            task: {
              anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } }
              ],
              description: "Optional: Specific task ID(s) to run"
            },
            step: {
              anyOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } }
              ],
              description: "Optional: Filter tasks by step ID(s)"
            },
            project_path: {
              type: "string",
              description: "Path to the project root containing pendrop.yml"
            },
            pendrop_file: {
              type: "string",
              description: "Optional: Custom configuration filename (default: pendrop.yml)"
            },
            variables: {
              type: "object",
              description: "Additional variables for template substitution (overrides config)"
            }
          },
          required: ["workflow", "project_path"]
        }
      },
      {
        name: "extract_asset",
        description: "Extract parts from an asset using JSONPath",
        inputSchema: {
          type: "object",
          properties: {
            asset_id: {
              type: "string",
              description: "ID of the asset to extract from"
            },
            jsonpath: {
              type: "string",
              description: "JSONPath expression to extract (e.g., '$.definitions.component')"
            },
            project_path: {
              type: "string",
              description: "Path to the project root containing pendrop.yml"
            },
            workflow: {
              type: "string",
              description: "Name of the workflow (required to resolve assets)"
            },
            options: {
              type: "object",
              properties: {
                minify: {
                  type: "boolean",
                  description: "Minify the output JSON"
                }
              }
            }
          },
          required: ["asset_id", "jsonpath", "project_path", "workflow"]
        }
      },
      {
        name: "save_asset",
        description: "Save data to a writeable asset with deep merge support",
        inputSchema: {
          type: "object",
          properties: {
            asset_id: {
              type: "string",
              description: "ID of the asset to save to"
            },
            data: {
              type: "object",
              description: "Data to save"
            },
            project_path: {
              type: "string",
              description: "Path to the project root containing pendrop.yml"
            },
            workflow: {
              type: "string",
              description: "Name of the workflow (required to resolve assets)"
            },
            options: {
              type: "object",
              properties: {
                merge: {
                  type: "boolean",
                  description: "Merge with existing data (deep merge)"
                },
                validate: {
                  type: "boolean",
                  description: "Validate against schema if provided"
                },
                dryrun: {
                  type: "boolean",
                  description: "Only validate, don't save"
                }
              }
            }
          },
          required: ["asset_id", "data", "project_path", "workflow"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "compose_workflow") {
    const schema = z.object({
      workflow: z.string(),
      task: z.union([z.string(), z.array(z.string())]).optional(),
      step: z.union([z.string(), z.array(z.string())]).optional(),
      project_path: z.string(),
      pendrop_file: z.string().optional(),
      variables: z.record(z.any()).optional()
    });

    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      throw new Error(`Invalid arguments: ${parsed.error.message}`);
    }

    try {
      const result = await runWorkflow({
        workflow: parsed.data.workflow,
        task: parsed.data.task,
        step: parsed.data.step,
        project_path: parsed.data.project_path,
        pendrop_file: parsed.data.pendrop_file,
        variables: parsed.data.variables
      });
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
            text: `Error composing workflow: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

  if (name === "extract_asset") {
    const schema = z.object({
      asset_id: z.string(),
      jsonpath: z.string(),
      project_path: z.string(),
      workflow: z.string(),
      options: z.object({
        minify: z.boolean().optional()
      }).optional()
    });

    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      throw new Error(`Invalid arguments: ${parsed.error.message}`);
    }

    try {
      // Load merged config using new logic (no file lookup needed, just workflow name)
      const mergedConfig = await loadMergedConfig(
        parsed.data.project_path,
        parsed.data.workflow
      );

      // Add built-in variables
      const variablesWithBuiltIns = {
        ...mergedConfig.variables,
        project_path: parsed.data.project_path
      };

      const result = await extractAsset(
        parsed.data.asset_id,
        parsed.data.jsonpath,
        parsed.data.options || {},
        mergedConfig.assets,
        parsed.data.project_path,
        variablesWithBuiltIns
      );

      return {
        content: [
          {
            type: "text",
            text: result
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error extracting asset: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

  if (name === "save_asset") {
    const schema = z.object({
      asset_id: z.string(),
      data: z.record(z.any()),
      project_path: z.string(),
      workflow: z.string(),
      options: z.object({
        merge: z.boolean().optional(),
        validate: z.boolean().optional(),
        dryrun: z.boolean().optional()
      }).optional()
    });

    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      throw new Error(`Invalid arguments: ${parsed.error.message}`);
    }

    try {
      const mergedConfig = await loadMergedConfig(
        parsed.data.project_path,
        parsed.data.workflow
      );

      const variablesWithBuiltIns = {
        ...mergedConfig.variables,
        project_path: parsed.data.project_path
      };

      const result = await saveAsset(
        parsed.data.asset_id,
        parsed.data.data,
        mergedConfig.assets,
        parsed.data.project_path,
        variablesWithBuiltIns,
        parsed.data.options || {}
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error saving asset: ${error instanceof Error ? error.message : String(error)}`
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
