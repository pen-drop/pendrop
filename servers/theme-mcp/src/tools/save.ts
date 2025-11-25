/**
 * Save Tool
 * Saves validated design data to project
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { loadPendropConfig, resolvePaths } from '../utils/projectConfig.js';
import { loadConventions } from '../utils/conventions.js';

export interface SaveDesignDataParams {
  data: unknown;
  project_path: string;
}

export interface SaveDesignDataResult {
  success: boolean;
  path: string;
  message: string;
}

export async function saveDesignData(
  params: SaveDesignDataParams
): Promise<SaveDesignDataResult> {
  const { data, project_path } = params;
  
  // Load config
  const pendropConfig = await loadPendropConfig(project_path);
  
  // Resolve output path
  const conventions = await loadConventions({
    target: pendropConfig.project.type,
    rulesPath: '../../rules',
    projectRules: pendropConfig.rules?.custom_rules_path
  });
  const resolvedConventions = resolvePaths(
    conventions,
    pendropConfig.project.theme
  );
  
  const outputPath = join(project_path, (resolvedConventions.paths as Record<string, string>).design_data || '.pendrop/dist/pendrop.data.ds.json');
  
  // Ensure directory exists
  await mkdir(dirname(outputPath), { recursive: true });
  
  // Write file
  await writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  
  return {
    success: true,
    path: outputPath,
    message: `✓ Design system data saved to ${outputPath}`
  };
}

/**
 * Tool definition for MCP
 */
export const saveDesignDataTool = {
  name: 'save_design_data',
  description: 'Save validated design data to .pendrop/dist/',
  inputSchema: {
    type: 'object',
    properties: {
      data: { 
        type: 'object',
        description: 'The validated design data to save'
      },
      project_path: { 
        type: 'string',
        description: 'Path to the project root'
      }
    },
    required: ['data', 'project_path']
  }
};

