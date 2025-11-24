/**
 * Configuration module for the Penpot MCP server.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

/**
 * Server configuration
 */
export const PORT = parseInt(process.env.PORT || '5000', 10);
export const DEBUG = process.env.DEBUG?.toLowerCase() === 'true';
export const RESOURCES_AS_TOOLS = process.env.RESOURCES_AS_TOOLS?.toLowerCase() === 'true';

/**
 * HTTP server for exported images
 */
export const ENABLE_HTTP_SERVER = process.env.ENABLE_HTTP_SERVER?.toLowerCase() !== 'false';
export const HTTP_SERVER_HOST = process.env.HTTP_SERVER_HOST || 'localhost';
export const HTTP_SERVER_PORT = parseInt(process.env.HTTP_SERVER_PORT || '0', 10);

/**
 * Penpot API configuration
 */
export const PENPOT_API_URL = process.env.PENPOT_API_URL || 'https://design.penpot.app/api';
export const PENPOT_USERNAME = process.env.PENPOT_USERNAME;
export const PENPOT_PASSWORD = process.env.PENPOT_PASSWORD;

/**
 * MCP mode (stdio or sse)
 */
export const MODE = process.env.MODE || 'stdio';

/**
 * Resources path
 */
export const RESOURCES_PATH = path.join(__dirname, '..', '..', 'resources');

