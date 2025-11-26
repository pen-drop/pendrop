/**
 * Config Loader
 * Loads and merges assets and variables from all sources
 */

import type { Assets, Variables, ConfigSection } from '../types/config.js';
import { loadPendropConfig } from './projectConfig.js';
import { loadPipeline } from './pipelineLoader.js';
import { loadTasks } from './tasksLoader.js';
import { getRepositoryRoot } from './paths.js';

export interface MergedConfig {
  assets: Assets;
  variables: Variables;
}

/**
 * Merge multiple ConfigSection objects
 * Later sections override earlier ones (shallow merge for objects)
 */
function mergeConfigSections(...sections: ConfigSection[]): ConfigSection {
  const merged: ConfigSection = {
    assets: {},
    variables: {}
  };

  for (const section of sections) {
    if (section.assets) {
      merged.assets = { ...merged.assets, ...section.assets };
    }
    if (section.variables) {
      merged.variables = { ...merged.variables, ...section.variables };
    }
  }

  return merged;
}

/**
 * Load and merge assets and variables from all sources
 * Priority: pendrop.yml (root) > pendrop.yml (pipeline) > pipeline.yaml > tasks.yml
 */
export async function loadMergedConfig(
  projectPath: string,
  pipelineName: string,
  tasksPackage: string
): Promise<MergedConfig> {
  const repoRoot = getRepositoryRoot();

  // 1. Load pendrop.yml (root level)
  const projectConfig = await loadPendropConfig(projectPath);
  const rootConfig: ConfigSection = {
    assets: projectConfig.assets,
    variables: projectConfig.variables
  };

  // 2. Load pendrop.yml (pipeline-specific)
  const pipelineConfig = projectConfig.pipelines?.[pipelineName];
  const pipelineConfigSection: ConfigSection = {
    assets: pipelineConfig?.assets,
    variables: pipelineConfig?.variables
  };

  // 3. Load pipeline.yaml
  const tasksData = await loadTasks(tasksPackage, repoRoot);
  const pipelineData = await loadPipeline(tasksData.pipeline, repoRoot);
  const pipelineYamlConfig: ConfigSection = {
    assets: pipelineData.assets,
    variables: pipelineData.variables
  };

  // 4. Load tasks.yml
  const tasksConfig: ConfigSection = {
    assets: tasksData.assets,
    variables: tasksData.variables
  };

  // Merge with priority: root > pipeline > pipeline.yaml > tasks.yml
  const merged = mergeConfigSections(
    tasksConfig,        // Lowest priority
    pipelineYamlConfig,
    pipelineConfigSection,
    rootConfig          // Highest priority
  );

  return {
    assets: merged.assets || {},
    variables: merged.variables || {}
  };
}

