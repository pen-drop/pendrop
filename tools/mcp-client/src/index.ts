#!/usr/bin/env node

/**
 * MCP Client Tool
 * Generic CLI client for testing any MCP server in the project
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

// Map server names to their executable paths (relative to project root)
const SERVER_MAP: Record<string, string> = {
  'penpot-mcp': 'servers/penpot-mcp/dist/index.js',
  'theme-mcp': 'servers/theme-mcp/dist/index.js',
  // Add other servers here as needed
};

async function run() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Extract server argument
  let serverName = '';
  let serverPath = '';
  
  // Filter out server argument and keep the rest
  const toolArgsRaw: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--server') {
      if (i + 1 < args.length) {
        serverName = args[i + 1];
        i++; // Skip next arg
      } else {
        console.error('❌ Error: --server flag requires a value');
        process.exit(1);
      }
    } else {
      toolArgsRaw.push(args[i]);
    }
  }

  if (!serverName) {
    console.error('❌ Error: Please specify a server using --server <name>');
    console.log('Available servers:');
    Object.keys(SERVER_MAP).forEach(name => console.log(`  - ${name}`));
    process.exit(1);
  }

  // Resolve server path
  if (SERVER_MAP[serverName]) {
    serverPath = path.resolve(projectRoot, SERVER_MAP[serverName]);
  } else {
    // Check if provided as a direct path (fallback)
    if (fs.existsSync(serverName)) {
      serverPath = path.resolve(process.cwd(), serverName);
    } else {
      console.error(`❌ Error: Unknown server '${serverName}' and not a valid path`);
      process.exit(1);
    }
  }

  if (!fs.existsSync(serverPath)) {
    console.error(`❌ Error: Server executable not found at ${serverPath}`);
    console.error(`   Make sure you have built the server first: npm run build --prefix servers/${serverName}`);
    process.exit(1);
  }

  console.log(`🚀 Starting MCP Client for ${serverName}...`);
  console.log(`   Server path: ${serverPath}`);

  // Start the MCP Server
  const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: { ...process.env }
  });

  // Create Client
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
  });

  const client = new Client(
    {
      name: 'mcp-cli-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP Server\n');

    const toolName = toolArgsRaw[0];

    if (!toolName) {
      console.log('📋 Available Tools:');
      const tools = await client.listTools();
      tools.tools.forEach((tool) => {
        console.log(`  - ${tool.name}: ${tool.description}`);
      });
      console.log('\n💡 Usage: npm run mcp:test -- --server <server> <tool-name> [args...]');
      console.log('   Example: npm run mcp:test -- --server penpot-mcp list_projects');
      
      await client.close();
      serverProcess.kill();
      process.exit(0);
    }

    // Parse tool arguments
    const toolParams: Record<string, any> = {};
    for (let i = 1; i < toolArgsRaw.length; i += 2) {
      const key = toolArgsRaw[i].replace(/^--/, '');
      const value = toolArgsRaw[i + 1];
      
      if (value === undefined) {
        console.warn(`⚠️ Warning: Flag --${key} has no value, ignoring.`);
        continue;
      }

      // Try to parse JSON for arrays/objects/booleans/numbers
      try {
        // Special handling for strings that look like JSON but should be strings?
        // Usually JSON.parse is good, but if value is "true", it becomes boolean true.
        // If user wants string "true", they need to quote it twice? 
        // For CLI simplicity, we assume standard types.
        toolParams[key] = JSON.parse(value);
      } catch {
        toolParams[key] = value;
      }
    }

    console.log(`🔧 Executing tool: ${toolName}`);
    if (Object.keys(toolParams).length > 0) {
      console.log(`📝 Tools arguments:`, toolParams);
    }
    console.log('');

    const result = await client.callTool({
      name: toolName,
      arguments: toolParams,
    });

    console.log('✅ Result:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await client.close();
    serverProcess.kill();
  }
}

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

