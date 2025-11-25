/**
 * Design Extraction Tool
 * Routes to appropriate extraction MCP and returns pendrop.data.ds.json
 */

import { routeExtraction } from '../utils/router.js';
import type { ThemeMcpConfig } from '../utils/config.js';

export interface ExtractDesignParams {
  fileUrl: string;
  options?: {
    includeHiddenLayers?: boolean;
    [key: string]: unknown;
  };
}

export interface ExtractDesignResult {
  success: boolean;
  data?: unknown; // pendrop.data.ds.json structure
  tool?: string;
  error?: string;
}

/**
 * Extract design data from URL
 * Routes to appropriate MCP based on URL pattern
 */
export async function extractDesign(
  params: ExtractDesignParams,
  config: ThemeMcpConfig
): Promise<ExtractDesignResult> {
  const { fileUrl, options = {} } = params;
  
  // Route to appropriate MCP
  const { tool, server } = routeExtraction(fileUrl, config);
  
  if (!server) {
    return {
      success: false,
      error: `Unsupported design tool or URL: ${fileUrl}. Detected tool: ${tool}`,
    };
  }
  
  // TODO: Actually call the extraction MCP server
  // For now, return a placeholder structure
  
  return {
    success: true,
    tool,
    data: {
      $schema: 'https://raw.githubusercontent.com/pen-drop/pendrop/1.x/schemas/pendrop.design-system.json',
      tokens: {},
      components: {},
      stories: {},
      _extracted_from: fileUrl,
      _extraction_tool: tool,
      _extraction_options: options,
    },
    error: 'Note: Actual MCP bridge call not yet implemented. This is a placeholder response.',
  };
}

/**
 * Tool definition for MCP
 */
export const extractDesignTool = {
  name: 'extract_design',
  description: 'Extract design system data from Penpot or Figma URL. Routes to appropriate extraction MCP and returns pendrop.design-system.json format.',
  inputSchema: {
    type: 'object',
    properties: {
      fileUrl: {
        type: 'string',
        description: 'URL or path to design file (Penpot or Figma)',
      },
      options: {
        type: 'object',
        description: 'Optional extraction options',
        properties: {
          includeHiddenLayers: {
            type: 'boolean',
            description: 'Include hidden layers in extraction',
          },
        },
      },
    },
    required: ['fileUrl'],
  },
};

