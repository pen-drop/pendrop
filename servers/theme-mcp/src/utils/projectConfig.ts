/**
 * Project Configuration Management
 * Loads and parses pendrop.yml from project root
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import YAML from 'yaml';

export interface PendropConfig {
  project: {
    type: string;
    name: string;
    theme: string;
  };
  design?: {
    url?: string;
    urls?: string[];
    auth?: {
      penpot?: {
        username?: string;
        password?: string;
        token?: string;
      };
      figma?: {
        token?: string;
      };
    };
  };
  rules?: {
    custom_rules_path?: string;
    conventions?: Record<string, unknown>;
  };
}

/**
 * Load pendrop.yml configuration from project root
 */
export async function loadPendropConfig(projectPath: string): Promise<PendropConfig> {
  const configPath = join(projectPath, 'pendrop.yml');
  
  try {
    const content = await readFile(configPath, 'utf-8');
    const config = YAML.parse(content) as PendropConfig;
    
    // Validate required fields
    if (!config.project || !config.project.type || !config.project.theme) {
      throw new Error('Invalid pendrop.yml: project.type and project.theme are required');
    }
    
    return config;
  } catch (error) {
    throw new Error(`Failed to load pendrop.yml from ${configPath}: ${error}`);
  }
}

/**
 * Resolve paths with {theme_name} placeholder
 * Replaces {theme_name} in convention paths with actual theme name from config
 */
export function resolvePaths(
  conventions: Record<string, unknown>,
  themeName: string
): Record<string, unknown> {
  const resolved = { ...conventions };
  
  // Resolve paths object
  if (resolved.paths && typeof resolved.paths === 'object') {
    const paths = { ...(resolved.paths as Record<string, unknown>) };
    
    for (const key in paths) {
      if (typeof paths[key] === 'string') {
        paths[key] = (paths[key] as string).replace('{theme_name}', themeName);
      }
    }
    
    resolved.paths = paths;
  }
  
  return resolved;
}

/**
 * Get design URLs from config
 * Returns array of URLs (handles both single url and multiple urls)
 */
export function getDesignUrls(config: PendropConfig): string[] {
  if (!config.design) {
    return [];
  }
  
  if (config.design.url) {
    return [config.design.url];
  }
  
  if (config.design.urls) {
    return config.design.urls;
  }
  
  return [];
}

/**
 * Get authentication credentials for a design tool
 */
export function getAuth(
  config: PendropConfig,
  tool: 'penpot' | 'figma'
): Record<string, string> | null {
  if (!config.design?.auth?.[tool]) {
    return null;
  }
  
  const auth = config.design.auth[tool];
  const credentials: Record<string, string> = {};
  
  if (tool === 'penpot') {
    if (auth.username) credentials.username = auth.username;
    if (auth.password) credentials.password = auth.password;
    if (auth.token) credentials.token = auth.token;
  } else if (tool === 'figma') {
    if (auth.token) credentials.token = auth.token;
  }
  
  return Object.keys(credentials).length > 0 ? credentials : null;
}

