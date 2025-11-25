/**
 * MCP Communication Logger
 * Logs all communication between theme-mcp and other MCP servers
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface McpLogEntry {
  timestamp: string;
  direction: 'outgoing' | 'incoming';
  targetMcp: string;
  tool: string;
  params?: unknown;
  result?: unknown;
  error?: string;
  duration?: number;
}

export interface McpLoggerConfig {
  enabled: boolean;
  logToFile: boolean;
  logToConsole: boolean;
  projectPath?: string; // Path to directory containing pendrop.yml (project root) - used to resolve .pendrop/logs
  logLevel?: 'all' | 'errors' | 'summary';
}

const defaultConfig: McpLoggerConfig = {
  enabled: true,
  logToFile: true,
  logToConsole: true,
  projectPath: undefined,
  logLevel: 'all',
};

let config: McpLoggerConfig = defaultConfig;
let logBuffer: McpLogEntry[] = [];
const MAX_BUFFER_SIZE = 1000; // Increased for single file storage

/**
 * Initialize logger with configuration
 */
export function initLogger(customConfig?: Partial<McpLoggerConfig>): void {
  config = { ...defaultConfig, ...customConfig };
  
  // Note: Log directory will be created when first log entry is written
  // This allows the directory to be resolved relative to the project path
}

/**
 * Set project path for logger
 * @param projectPath - Path to the directory containing pendrop.yml (project root)
 * Logs will be stored in <projectPath>/.pendrop/logs/log.json
 */
export function setLoggerProjectPath(projectPath: string): void {
  config.projectPath = projectPath;
}

/**
 * Log MCP communication
 */
export async function logMcpCommunication(
  direction: 'outgoing' | 'incoming',
  targetMcp: string,
  tool: string,
  params?: unknown,
  result?: unknown,
  error?: string,
  duration?: number
): Promise<void> {
  if (!config.enabled) {
    return;
  }

  const entry: McpLogEntry = {
    timestamp: new Date().toISOString(),
    direction,
    targetMcp,
    tool,
    params,
    result,
    error,
    duration,
  };

  // Add to buffer
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift(); // Remove oldest entry
  }

  // Console logging
  if (config.logToConsole) {
    logToConsole(entry);
  }

  // File logging
  if (config.logToFile && config.projectPath) {
    await logToFile(entry);
  }
}

/**
 * Log outgoing MCP call (theme-mcp → other MCP)
 */
export async function logOutgoingCall(
  targetMcp: string,
  tool: string,
  params: unknown
): Promise<void> {
  await logMcpCommunication('outgoing', targetMcp, tool, params);
}

/**
 * Log incoming MCP response (other MCP → theme-mcp)
 */
export async function logIncomingResponse(
  targetMcp: string,
  tool: string,
  result: unknown,
  error?: string,
  duration?: number
): Promise<void> {
  await logMcpCommunication('incoming', targetMcp, tool, undefined, result, error, duration);
}

/**
 * Log complete MCP call (outgoing + incoming)
 */
export async function logMcpCall(
  targetMcp: string,
  tool: string,
  params: unknown,
  result: unknown,
  error?: string,
  duration?: number
): Promise<void> {
  await logOutgoingCall(targetMcp, tool, params);
  await logIncomingResponse(targetMcp, tool, result, error, duration);
}

/**
 * Log to console
 */
function logToConsole(entry: McpLogEntry): void {
  const prefix = entry.direction === 'outgoing' ? '→' : '←';
  const icon = entry.error ? '❌' : '✅';
  const durationStr = entry.duration ? ` (${entry.duration}ms)` : '';
  
  if (config.logLevel === 'errors' && !entry.error) {
    return;
  }

  if (config.logLevel === 'summary') {
    console.error(
      `${prefix} ${icon} ${entry.targetMcp}.${entry.tool}${durationStr}${entry.error ? ` - ${entry.error}` : ''}`
    );
  } else {
    console.error(`\n${prefix} MCP Communication ${icon}`);
    console.error(`  Target: ${entry.targetMcp}`);
    console.error(`  Tool: ${entry.tool}`);
    console.error(`  Timestamp: ${entry.timestamp}`);
    if (entry.duration) {
      console.error(`  Duration: ${entry.duration}ms`);
    }
    if (entry.params) {
      console.error(`  Params:`, JSON.stringify(entry.params, null, 2).substring(0, 500));
    }
    if (entry.result) {
      const resultStr = JSON.stringify(entry.result, null, 2);
      console.error(`  Result:`, resultStr.substring(0, 500) + (resultStr.length > 500 ? '...' : ''));
    }
    if (entry.error) {
      console.error(`  Error: ${entry.error}`);
    }
    console.error('');
  }
}

/**
 * Log to file
 * Stores all logs in a single log.json file in .pendrop/logs/ relative to project root
 */
async function logToFile(entry: McpLogEntry): Promise<void> {
  if (!config.projectPath) {
    // If no project path is set, skip file logging
    return;
  }

  try {
    // Resolve log directory relative to project root (where pendrop.yml is located)
    // Logs are stored in <project_root>/.pendrop/logs/log.json
    const logDir = join(config.projectPath, '.pendrop', 'logs');
    await mkdir(logDir, { recursive: true });
    
    // Single log file: log.json
    const logFile = join(logDir, 'log.json');
    
    // Read existing logs or initialize empty array
    let allLogs: McpLogEntry[] = [];
    try {
      const existingContent = await readFile(logFile, 'utf-8');
      allLogs = JSON.parse(existingContent);
      if (!Array.isArray(allLogs)) {
        allLogs = [];
      }
    } catch {
      // File doesn't exist or is invalid, start fresh
      allLogs = [];
    }
    
    // Add new entry
    allLogs.push(entry);
    
    // Keep only last MAX_BUFFER_SIZE entries
    if (allLogs.length > MAX_BUFFER_SIZE) {
      allLogs = allLogs.slice(-MAX_BUFFER_SIZE);
    }
    
    // Write back as formatted JSON
    await writeFile(logFile, JSON.stringify(allLogs, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write MCP log:', error);
  }
}

/**
 * Get log buffer (for debugging)
 */
export function getLogBuffer(): McpLogEntry[] {
  return [...logBuffer];
}

/**
 * Clear log buffer
 */
export function clearLogBuffer(): void {
  logBuffer = [];
}

/**
 * Export logs to JSON file
 */
export async function exportLogs(outputPath: string): Promise<void> {
  try {
    const logs = getLogBuffer();
    const content = JSON.stringify(logs, null, 2);
    await writeFile(outputPath, content, 'utf-8');
  } catch (error) {
    console.error('Failed to export logs:', error);
    throw error;
  }
}

