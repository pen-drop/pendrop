/**
 * Configuration Management
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ThemeMcpConfig {
  target: string;
  rulesPath: string;
  projectRules?: string | null;
  extractors: {
    [key: string]: {
      serverUrl: string;
      mcpPath: string;
    };
  };
}

const defaultConfig: ThemeMcpConfig = {
  target: 'drupal',
  rulesPath: join(__dirname, '../../../rules/theme'),
  projectRules: null,
  extractors: {
    penpot: {
      serverUrl: 'http://localhost:3000',
      mcpPath: join(__dirname, '../../../penpot-mcp'),
    },
    figma: {
      serverUrl: 'http://localhost:3001',
      mcpPath: join(__dirname, '../../../figma-mcp'),
    },
  },
};

/**
 * Load configuration from file or use defaults
 */
export async function loadConfig(configPath?: string): Promise<ThemeMcpConfig> {
  if (!configPath) {
    return defaultConfig;
  }
  
  try {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content) as Partial<ThemeMcpConfig>;
    
    // Merge with defaults
    return {
      ...defaultConfig,
      ...config,
      extractors: {
        ...defaultConfig.extractors,
        ...(config.extractors || {}),
      },
    };
  } catch (error) {
    console.warn(`Failed to load config from ${configPath}, using defaults:`, error);
    return defaultConfig;
  }
}

/**
 * Get configuration value
 */
export function getConfigValue<K extends keyof ThemeMcpConfig>(
  config: ThemeMcpConfig,
  key: K
): ThemeMcpConfig[K] {
  return config[key];
}

