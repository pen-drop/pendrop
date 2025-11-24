/**
 * URL Router
 * Routes design file URLs to appropriate extraction MCP servers
 */

export type DesignTool = 'penpot' | 'figma' | 'unknown';

export interface RouterConfig {
  extractors: {
    [key: string]: {
      serverUrl: string;
      mcpPath: string;
    };
  };
}

/**
 * Detect design tool from URL or file path
 */
export function detectDesignTool(fileUrl: string): DesignTool {
  const url = fileUrl.toLowerCase();
  
  // Penpot patterns
  if (url.includes('penpot.com') || url.includes('design.penpot.app') || url.includes('penpot.app')) {
    return 'penpot';
  }
  
  // Figma patterns
  if (url.includes('figma.com') || url.includes('www.figma.com')) {
    return 'figma';
  }
  
  // Local file detection (future)
  // Could analyze file extension or content
  
  return 'unknown';
}

/**
 * Get MCP server configuration for a design tool
 */
export function getMcpServer(tool: DesignTool, config: RouterConfig): { serverUrl: string; mcpPath: string } | null {
  if (tool === 'unknown') {
    return null;
  }
  
  return config.extractors[tool] || null;
}

/**
 * Route extraction request to appropriate MCP server
 * Returns the MCP server info or null if tool is not supported
 */
export function routeExtraction(fileUrl: string, config: RouterConfig): {
  tool: DesignTool;
  server: { serverUrl: string; mcpPath: string } | null;
} {
  const tool = detectDesignTool(fileUrl);
  const server = getMcpServer(tool, config);
  
  return { tool, server };
}

