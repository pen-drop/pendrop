/**
 * Schema MCP Server Implementation
 * Provides content structure and CMS configuration generation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { loadConfig, type SchemaMcpConfig } from '../utils/config.js';
import { loadAllConventions, type Convention } from '../utils/conventions.js';
import {
  generateContentTypes,
  generateConfig,
  validateStructure,
  generateContentTypesTool,
  generateConfigTool,
  validateStructureTool,
  type GenerateContentTypesParams,
  type GenerateConfigParams,
  type ValidateStructureParams,
} from '../tools/generate.js';

// Server state
let config: SchemaMcpConfig;
let conventions: {
  conventions: Convention;
  prompts: Convention;
};

/**
 * Initialize server
 */
async function initialize() {
  // Load configuration
  const configPath = process.env.SCHEMA_MCP_CONFIG;
  config = await loadConfig(configPath);
  
  // Load conventions for the target
  conventions = await loadAllConventions({
    target: config.target,
    rulesPath: config.rulesPath,
    projectRules: config.projectRules,
  });
  
  console.error('Schema MCP Server initialized');
  console.error(`Target: ${config.target}`);
  console.error(`Rules path: ${config.rulesPath}`);
  console.error(`Project rules: ${config.projectRules || 'none'}`);
  console.error(`Schemas path: ${config.schemasPath}`);
}

/**
 * Start the MCP server
 */
export async function startServer(): Promise<void> {
  // Initialize
  await initialize();
  
  // Create MCP server
  const server = new Server(
    {
      name: 'schema-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [generateContentTypesTool, generateConfigTool, validateStructureTool],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'generate_content_types': {
          const result = await generateContentTypes(
            args as GenerateContentTypesParams,
            conventions
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'generate_config': {
          const result = await generateConfig(
            args as GenerateConfigParams,
            conventions
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'validate_structure': {
          const result = await validateStructure(
            args as ValidateStructureParams
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: errorMessage }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  // Connect to transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Schema MCP Server running on stdio');
}

