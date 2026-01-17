/**
 * Config Loader
 * Loads and merges assets and variables from all sources
 */

import type { Assets, Variables, ConfigSection } from '../types/config.js';
import { loadPendropConfig } from './pendropConfig.js';

export interface MergedConfig {
  assets: Assets;
  variables: Variables;
}

/**
 * Load and merge assets and variables from all sources
 * Priority: Workflow > Global Config
 */
export async function loadMergedConfig(
  projectPath: string,
  workflowName: string
): Promise<MergedConfig> {
  
  // 1. Load pendrop.yml
  const projectConfig = await loadPendropConfig(projectPath);
  
  // 2. Get Workflow
  const workflow = projectConfig.workflows?.[workflowName];
  if (!workflow) {
      throw new Error(`Workflow '${workflowName}' not found in pendrop.yml`);
  }

  // 3. Merge Config
  // Global (Base) -> Workflow (Override)
  const mergedAssets = { ...projectConfig.assets, ...workflow.assets };
  const mergedVariables = { ...projectConfig.variables, ...workflow.variables };

  return {
    assets: mergedAssets,
    variables: mergedVariables
  };
}
