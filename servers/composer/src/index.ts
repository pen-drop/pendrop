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
import { loadMergedConfig } from "./utils/configLoader.js";
import { extractAsset, saveAsset } from "./utils/assetManager.js";
import { loadPendropConfig } from "./utils/projectConfig.js";

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
            pipeline: {
              type: "string",
              description: "Name of the pipeline (required to resolve assets)"
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
          required: ["asset_id", "jsonpath", "project_path", "pipeline"]
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
            pipeline: {
              type: "string",
              description: "Name of the pipeline (required to resolve assets)"
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
          required: ["asset_id", "data", "project_path", "pipeline"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "compose_pipeline") {
    const schema = z.object({
      pipeline: z.string(),
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

  if (name === "extract_asset") {
    const schema = z.object({
      asset_id: z.string(),
      jsonpath: z.string(),
      project_path: z.string(),
      pipeline: z.string(),
      options: z.object({
        minify: z.boolean().optional()
      }).optional()
    });

    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      throw new Error(`Invalid arguments: ${parsed.error.message}`);
    }

    try {
      // Load project config to get tasks package
      const projectConfig = await loadPendropConfig(parsed.data.project_path);
      const pipelineConfig = projectConfig.pipelines?.[parsed.data.pipeline];
      if (!pipelineConfig) {
        throw new Error(`Pipeline '${parsed.data.pipeline}' not found`);
      }

      // Load merged config
      const mergedConfig = await loadMergedConfig(
        parsed.data.project_path,
        parsed.data.pipeline,
        pipelineConfig.tasks
      );

      // Add built-in variables for asset path resolution
      const variablesWithBuiltIns = {
        ...mergedConfig.variables,
        project_path: parsed.data.project_path
      };

      // Extract asset
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
      pipeline: z.string(),
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
      // Load project config to get tasks package
      const projectConfig = await loadPendropConfig(parsed.data.project_path);
      const pipelineConfig = projectConfig.pipelines?.[parsed.data.pipeline];
      if (!pipelineConfig) {
        throw new Error(`Pipeline '${parsed.data.pipeline}' not found`);
      }

      // Load merged config
      const mergedConfig = await loadMergedConfig(
        parsed.data.project_path,
        parsed.data.pipeline,
        pipelineConfig.tasks
      );

      // Add built-in variables for asset path resolution
      const variablesWithBuiltIns = {
        ...mergedConfig.variables,
        project_path: parsed.data.project_path
      };

      // Save asset
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
