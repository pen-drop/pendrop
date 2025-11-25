/**
 * Convention Loading
 * Reuses convention loading logic similar to theme-mcp
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

async function loadConventionFile(filePath: string): Promise<Convention | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return YAML.parse(content) as Convention;
  } catch (error) {
    return null;
  }
}

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

export async function loadConventions(
  config: ConventionConfig,
  conventionType: 'conventions' | 'prompts' = 'conventions'
): Promise<Convention> {
  const { target, rulesPath, projectRules } = config;
  
  const targetPath = join(rulesPath, 'targets', target, `${conventionType}.yaml`);
  const targetConventions = await loadConventionFile(targetPath) || {};
  
  let projectConventions: Convention = {};
  if (projectRules) {
    const projectPath = join(projectRules, `custom-${conventionType}.yaml`);
    projectConventions = await loadConventionFile(projectPath) || {};
  }
  
  return deepMerge(targetConventions, projectConventions);
}

export async function loadAllConventions(config: ConventionConfig): Promise<{
  conventions: Convention;
  prompts: Convention;
}> {
  const [conventions, prompts] = await Promise.all([
    loadConventions(config, 'conventions'),
    loadConventions(config, 'prompts'),
  ]);
  
  return { conventions, prompts };
}

