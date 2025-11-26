/**
 * Project Configuration Management
 * Loads and parses pendrop.yml from project root
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';

export interface PipelineConfig {
  tasks: string;
  variables?: Record<string, any>;
}

export interface PendropConfig {
  pipelines?: Record<string, PipelineConfig>; // Pipeline configuration
}

/**
 * Load pendrop.yml configuration from project root
 * @param projectPath - Path to the directory containing pendrop.yml (project root)
 */
export async function loadPendropConfig(projectPath: string): Promise<PendropConfig> {
  const configPath = join(projectPath, 'pendrop.yml');
  
  try {
    const content = await readFile(configPath, 'utf-8');
    const config = yaml.load(content) as PendropConfig;
    
    return config;
  } catch (error) {
    throw new Error(`Failed to load pendrop.yml from ${configPath}: ${error}`);
  }
}


