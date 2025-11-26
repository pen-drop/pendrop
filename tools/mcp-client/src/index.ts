#!/usr/bin/env node

/**
 * MCP Client Tool
 * Generic CLI client for testing any MCP server in the project
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { colorize } from 'json-colorizer';
import { marked } from 'marked';
// @ts-ignore - marked-terminal doesn't have proper types
import { markedTerminal } from 'marked-terminal';

const execAsync = promisify(exec);

// Configure marked for terminal output
// markedTerminal() returns { renderer, useNewRenderer } which is a valid marked extension
// @ts-ignore - markedTerminal types are incomplete
marked.use(markedTerminal());

/**
 * Pretty print JSON with syntax highlighting
 */
function prettyPrintJson(obj: any, indent: number = 2): string {
  const jsonString = JSON.stringify(obj, null, indent);
  // Use json-colorizer with default colors
  return colorize(jsonString);
}

/**
 * Extract text content from MCP tool result
 */
function extractTextContent(result: any): string {
  if (!result || !result.content) {
    return '';
  }
  
  const textParts: string[] = [];
  for (const item of result.content) {
    if (item.type === 'text' && item.text) {
      textParts.push(item.text);
    }
  }
  
  return textParts.join('\n\n');
}

/**
 * Render markdown text beautifully for terminal
 */
async function renderMarkdown(markdown: string): Promise<string> {
  // Use marked.parse() instead of marked() to avoid renderer issues
  const result = await marked.parse(markdown);
  return result as string;
}

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

// Map server names to their executable paths (relative to project root)
const SERVER_MAP: Record<string, string> = {
  'penpot-mcp': 'servers/penpot-mcp/dist/index.js',
  'theme-mcp': 'servers/theme-mcp/dist/index.js',
  'composer': 'servers/composer/dist/index.js',
  // Add other servers here as needed
};

/**
 * Build a server by running npm run build in its directory
 */
async function buildServer(serverName: string, serverDir: string): Promise<void> {
  console.log(`🔨 Building server: ${serverName}`);
  console.log(`   Directory: ${serverDir}`);
  
  try {
    const { stdout, stderr } = await execAsync('npm run build', {
      cwd: serverDir,
      env: { ...process.env }
    });
    
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
    
    console.log(`✅ Build completed for ${serverName}\n`);
  } catch (error: any) {
    console.error(`❌ Build failed for ${serverName}:`, error.message);
    if (error.stdout) console.error(error.stdout);
    if (error.stderr) console.error(error.stderr);
    process.exit(1);
  }
}

async function run() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Extract server argument, build flag, and format flag
  let serverName = '';
  let serverPath = '';
  let shouldBuild = false;
  let outputFormat: 'pretty' | 'compact' | 'pretty-text' = 'pretty'; // Default: keep current pretty-printed behavior
  
  // Filter out server argument, build flag, and format flag, keep the rest
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
    } else if (args[i] === '--build') {
      shouldBuild = true;
    } else if (args[i] === '--format') {
      if (i + 1 < args.length) {
        const formatValue = args[i + 1].toLowerCase();
        if (formatValue === 'pretty' || formatValue === 'compact' || formatValue === 'pretty-text') {
          outputFormat = formatValue as 'pretty' | 'compact' | 'pretty-text';
          i++; // Skip next arg
        } else {
          console.error(`❌ Error: --format must be 'pretty', 'compact', or 'pretty-text', got '${formatValue}'`);
          process.exit(1);
        }
      } else {
        console.error('❌ Error: --format flag requires a value (pretty, compact, or pretty-text)');
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

  // Resolve server path and directory
  let serverDir = '';
  if (SERVER_MAP[serverName]) {
    serverPath = path.resolve(projectRoot, SERVER_MAP[serverName]);
    // Extract server directory from path (e.g., servers/penpot-mcp/dist/index.js -> servers/penpot-mcp)
    const distIndex = serverPath.indexOf('/dist/');
    if (distIndex !== -1) {
      serverDir = serverPath.substring(0, distIndex);
    } else {
      // Fallback: assume server directory is servers/${serverName}
      serverDir = path.resolve(projectRoot, `servers/${serverName}`);
    }
  } else {
    // Check if provided as a direct path (fallback)
    if (fs.existsSync(serverName)) {
      serverPath = path.resolve(process.cwd(), serverName);
      serverDir = path.dirname(path.dirname(serverPath)); // Go up from dist/index.js
    } else {
      console.error(`❌ Error: Unknown server '${serverName}' and not a valid path`);
      process.exit(1);
    }
  }

  // Build server if --build flag is set
  if (shouldBuild) {
    if (!fs.existsSync(serverDir)) {
      console.error(`❌ Error: Server directory not found at ${serverDir}`);
      process.exit(1);
    }
    await buildServer(serverName, serverDir);
  }

  if (!fs.existsSync(serverPath)) {
    console.error(`❌ Error: Server executable not found at ${serverPath}`);
    console.error(`   Make sure you have built the server first: npm run build --prefix servers/${serverName}`);
    console.error(`   Or use the --build flag to build automatically: npm run mcp:test -- --server ${serverName} --build`);
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
      console.log('\n💡 Usage: npm run mcp:test -- --server <server> [--build] [--format pretty|compact|pretty-text] <tool-name> [args...]');
      console.log('   Example: npm run mcp:test -- --server penpot-mcp list_projects');
      console.log('   Example with build: npm run mcp:test -- --server penpot-mcp --build list_projects');
      console.log('   Example with format: npm run mcp:test -- --server penpot-mcp --format pretty list_projects');
      console.log('   Example with pretty-text: npm run mcp:test -- --server composer --format pretty-text compose_pipeline --pipeline "design-extract" --project_path "/path/to/project"');
      
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
      if (outputFormat === 'pretty') {
        console.log(`📝 Tools arguments:`);
        console.log(prettyPrintJson(toolParams, 2));
      } else {
        console.log(`📝 Tools arguments:`, JSON.stringify(toolParams));
      }
    }
    console.log('');

    const result = await client.callTool({
      name: toolName,
      arguments: toolParams,
    });

    console.log('✅ Result:');
    if (outputFormat === 'pretty-text') {
      // Extract and render text content as markdown
      const textContent = extractTextContent(result);
      if (textContent) {
        const rendered = await renderMarkdown(textContent);
        console.log(rendered);
      } else {
        // Fallback to JSON if no text content found
        console.log(prettyPrintJson(result, 2));
      }
    } else if (outputFormat === 'pretty') {
      console.log(prettyPrintJson(result, 2));
    } else {
      console.log(JSON.stringify(result));
    }

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

