#!/usr/bin/env node

/**
 * Theme MCP Server
 * Bridge/orchestrator for design system extraction and code generation
 */

import { startServer } from './server/mcpServer.js';

// Start the MCP server
startServer().catch((error) => {
  console.error('Failed to start Theme MCP server:', error);
  process.exit(1);
});

