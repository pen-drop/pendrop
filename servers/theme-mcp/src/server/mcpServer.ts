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

import {
  saveDesignData,
  saveDesignDataTool,
  type SaveDesignDataParams,
} from '../tools/save.js';
import { initLogger } from '../utils/mcpLogger.js';

/**
 * Initialize server
 */
async function initialize() {
  // Initialize MCP logger
  const logEnabled = process.env.THEME_MCP_LOG_ENABLED !== 'false';
  const logToConsole = process.env.THEME_MCP_LOG_CONSOLE !== 'false';
  const logToFile = process.env.THEME_MCP_LOG_FILE !== 'false';
  const logLevel = (process.env.THEME_MCP_LOG_LEVEL as 'all' | 'errors' | 'summary') || 'all';
  
  initLogger({
    enabled: logEnabled,
    logToFile,
    logToConsole,
    logLevel,
    // projectPath will be set per-request via setLoggerProjectPath()
  });
  
  console.error('Theme MCP Server initialized');
  if (logEnabled) {
    console.error(`MCP logging: ${logToConsole ? 'console' : ''} ${logToFile ? 'file (.pendrop/logs/log.json relative to project root)' : ''} [${logLevel}]`);
  }
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
      version: '0.1.1', // Bumped version to trigger Cursor reload
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
      tools: [
        saveDesignDataTool,
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'save_design_data': {
          const result = await saveDesignData(
            args as unknown as SaveDesignDataParams
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

