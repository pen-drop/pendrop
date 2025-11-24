#!/usr/bin/env node

/**
 * CLI Tool zum direkten Testen von MCP Tools
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testMCP() {
  // Starte den MCP Server als Child Process
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  // Erstelle Transport und Client
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
  });

  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);

  console.log('✅ Connected to MCP Server\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const toolName = args[0];

  if (!toolName) {
    console.log('📋 Available Tools:');
    const tools = await client.listTools();
    tools.tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log('\n💡 Usage: npm run cli-test <tool-name> [args...]');
    console.log('   Example: npm run cli-test list_projects');
    process.exit(0);
  }

  // Parse tool arguments
  const toolArgs: Record<string, any> = {};
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    // Try to parse JSON for arrays/objects
    try {
      toolArgs[key] = JSON.parse(value);
    } catch {
      toolArgs[key] = value;
    }
  }

  console.log(`🔧 Executing tool: ${toolName}`);
  if (Object.keys(toolArgs).length > 0) {
    console.log(`📝 Arguments:`, toolArgs);
  }
  console.log('');

  try {
    const result = await client.callTool({
      name: toolName,
      arguments: toolArgs,
    });

    console.log('✅ Result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  await client.close();
  serverProcess.kill();
}

testMCP().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

