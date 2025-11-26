/**
 * Configuration Management
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { getRepositoryRoot } from './extractionRules.js';

export interface ThemeMcpConfig {
  target: string;
  rulesPath: string;
  projectRules?: string | null;
}

const defaultConfig: ThemeMcpConfig = {
  target: 'drupal',
  rulesPath: join(getRepositoryRoot(), 'rules/theme'),
  projectRules: null,
};

/**
 * Load configuration from file or use defaults
 * rulesPath can be overridden via THEME_MCP_RULES_PATH environment variable
 */
export async function loadConfig(configPath?: string): Promise<ThemeMcpConfig> {
  // Check for environment variable override
  const envRulesPath = process.env.THEME_MCP_RULES_PATH;
  
  const baseConfig: ThemeMcpConfig = {
    ...defaultConfig,
    rulesPath: envRulesPath || defaultConfig.rulesPath,
  };
  
  if (!configPath) {
    return baseConfig;
  }
  
  try {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content) as Partial<ThemeMcpConfig>;
    
    // Merge with defaults (env var takes precedence over file config)
    return {
      ...baseConfig,
      ...config,
      // Don't override rulesPath from env var if it's set
      rulesPath: envRulesPath || config.rulesPath || baseConfig.rulesPath,
    };
  } catch (error) {
    console.warn(`Failed to load config from ${configPath}, using defaults:`, error);
    return baseConfig;
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

