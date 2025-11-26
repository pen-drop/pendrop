/**
 * Convention Loading and Merging
 * Loads conventions from built-in, target, and project-specific files
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import YAML from 'yaml';

export interface Convention {
  [key: string]: unknown;
}

export interface ConventionConfig {
  target: string;
  rulesPath: string;
  projectRules?: string | null;
}

/**
 * Load a YAML convention file
 */
async function loadConventionFile(filePath: string): Promise<Convention | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return YAML.parse(content) as Convention;
  } catch (error) {
    // File doesn't exist or invalid YAML
    return null;
  }
}

/**
 * Deep merge two objects
 */
function deepMerge(target: Convention, source: Convention): Convention {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (target[key] as Convention) || {},
        source[key] as Convention
      );
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Load conventions for a target platform
 * Merges: built-in → target → project
 */
export async function loadConventions(
  config: ConventionConfig,
  conventionType: 'conventions' | 'prompts' | 'story' = 'conventions'
): Promise<Convention> {
  const { target, rulesPath, projectRules } = config;
  
  // 1. Load target conventions (built-in)
  // rulesPath already points to rules/theme, so just append targets
  const targetPath = join(rulesPath, 'targets', target, `${conventionType}.yaml`);
  const targetConventions = await loadConventionFile(targetPath) || {};
  
  // 2. Load project-specific conventions (if provided)
  let projectConventions: Convention = {};
  if (projectRules) {
    const projectPath = join(projectRules, `custom-${conventionType}.yaml`);
    projectConventions = await loadConventionFile(projectPath) || {};
  }
  
  // 3. Merge conventions (project overrides target)
  return deepMerge(targetConventions, projectConventions);
}

/**
 * Load all convention types for a target
 */
export async function loadAllConventions(config: ConventionConfig): Promise<{
  conventions: Convention;
  prompts: Convention;
  story: Convention;
}> {
  const [conventions, prompts, story] = await Promise.all([
    loadConventions(config, 'conventions'),
    loadConventions(config, 'prompts'),
    loadConventions(config, 'story'),
  ]);
  
  return { conventions, prompts, story };
}

/**
 * Validate conventions against schema (future enhancement)
 */
export async function validateConventions(_conventions: Convention): Promise<boolean> {
  // TODO: Load pendrop.rules.json schema and validate
  // For now, just return true
  return true;
}

