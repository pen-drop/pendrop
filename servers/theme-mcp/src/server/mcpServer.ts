/**
 * Theme MCP Server Implementation
 * Provides bridge/orchestrator functionality for design system operations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { loadConfig, type ThemeMcpConfig } from '../utils/config.js';
import { loadAllConventions, type Convention } from '../utils/conventions.js';
import {
  extractDesign,
  extractDesignTool,
  type ExtractDesignParams,
} from '../tools/extract.js';
import {
  generateComponent,
  generateStory,
  generateComponentTool,
  generateStoryTool,
  type GenerateComponentParams,
  type GenerateStoryParams,
} from '../tools/generate.js';

// Server state
let config: ThemeMcpConfig;
let conventions: {
  conventions: Convention;
  prompts: Convention;
  story: Convention;
};

/**
 * Initialize server
 */
async function initialize() {
  // Load configuration
  const configPath = process.env.THEME_MCP_CONFIG;
  config = await loadConfig(configPath);
  
  // Load conventions for the target
  conventions = await loadAllConventions({
    target: config.target,
    rulesPath: config.rulesPath,
    projectRules: config.projectRules,
  });
  
  console.error('Theme MCP Server initialized');
  console.error(`Target: ${config.target}`);
  console.error(`Rules path: ${config.rulesPath}`);
  console.error(`Project rules: ${config.projectRules || 'none'}`);
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
      name: 'theme-mcp',
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
      tools: [extractDesignTool, generateComponentTool, generateStoryTool],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'extract_design': {
          const result = await extractDesign(args as ExtractDesignParams, config);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'generate_component': {
          const result = await generateComponent(
            args as GenerateComponentParams,
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

        case 'generate_story': {
          const result = await generateStory(
            args as GenerateStoryParams,
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
  
  console.error('Theme MCP Server running on stdio');
}

