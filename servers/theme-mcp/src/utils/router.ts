/**
 * URL Router
 * Routes design file URLs to appropriate extraction MCP servers
 */

export type DesignTool = string;

export interface ToolPattern {
  patterns: string[];
  priority?: number;
}

export interface RouterConfig {
  extractors: {
    [key: string]: {
      serverUrl: string;
      mcpPath: string;
      urlPatterns?: string[];
    };
  };
}

/**
 * Built-in URL patterns for common design tools
 * Can be extended via configuration
 */
const DEFAULT_URL_PATTERNS: Record<string, string[]> = {
  penpot: ['penpot.com', 'design.penpot.app', 'penpot.app'],
  figma: ['figma.com', 'www.figma.com'],
  sketch: ['.sketch'],
  adobexd: ['.xd', 'xd.adobe.com'],
};

/**
 * Detect design tool from URL or file path
 * Uses configurable patterns + built-in defaults
 */
export function detectDesignTool(fileUrl: string, config?: RouterConfig): DesignTool {
  const url = fileUrl.toLowerCase();
  
  // Check configured extractors first
  if (config) {
    for (const [tool, extractorConfig] of Object.entries(config.extractors)) {
      const patterns = extractorConfig.urlPatterns || DEFAULT_URL_PATTERNS[tool] || [];
      if (patterns.some(pattern => url.includes(pattern))) {
        return tool;
      }
    }
  }
  
  // Fallback to built-in patterns
  for (const [tool, patterns] of Object.entries(DEFAULT_URL_PATTERNS)) {
    if (patterns.some(pattern => url.includes(pattern))) {
      return tool;
    }
  }
  
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
  const tool = detectDesignTool(fileUrl, config);
  const server = getMcpServer(tool, config);
  
  return { tool, server };
}

