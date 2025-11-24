#!/usr/bin/env node

/**
 * Main entry point for the Penpot MCP server
 */

import { PenpotMCPServer } from './server/mcpServer';

// Parse command line arguments
const args = process.argv.slice(2);
const debug = args.includes('--debug');
const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'stdio';

// Set environment variables based on arguments
if (debug) {
  process.env.DEBUG = 'true';
}
if (mode) {
  process.env.MODE = mode;
}

// Create and run the server
async function main() {
  try {
    const server = new PenpotMCPServer('Penpot MCP Server');
    await server.run();
  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down Penpot MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down Penpot MCP Server...');
  process.exit(0);
});

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

