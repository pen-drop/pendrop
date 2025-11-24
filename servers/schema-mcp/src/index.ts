#!/usr/bin/env node

/**
 * Schema MCP Server
 * Content structure and CMS configuration generation
 */

import { startServer } from './server/mcpServer.js';

// Start the MCP server
startServer().catch((error) => {
  console.error('Failed to start Schema MCP server:', error);
  process.exit(1);
});

