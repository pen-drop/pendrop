/**
 * Configuration Management
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface SchemaMcpConfig {
  target: string;
  rulesPath: string;
  projectRules?: string | null;
  schemasPath: string;
}

const defaultConfig: SchemaMcpConfig = {
  target: 'drupal',
  rulesPath: join(__dirname, '../../../rules'),
  projectRules: null,
  schemasPath: join(__dirname, '../../../schemas'),
};

/**
 * Load configuration from file or use defaults
 */
export async function loadConfig(configPath?: string): Promise<SchemaMcpConfig> {
  if (!configPath) {
    return defaultConfig;
  }
  
  try {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content) as Partial<SchemaMcpConfig>;
    
    // Merge with defaults
    return {
      ...defaultConfig,
      ...config,
    };
  } catch (error) {
    console.warn(`Failed to load config from ${configPath}, using defaults:`, error);
    return defaultConfig;
  }
}

