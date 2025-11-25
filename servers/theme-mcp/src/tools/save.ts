/**
 * Save Tool
 * Saves validated design data to project
 */

import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { loadPendropConfig } from '../utils/projectConfig.js';
import { setLoggerProjectPath } from '../utils/mcpLogger.js';

export interface SaveDesignDataParams {
  data: Record<string, unknown>;
  project_path: string; // Path to directory containing pendrop.yml (project root)
  type: 'tokens' | 'components' | 'stories';
}

export interface SaveDesignDataResult {
  success: boolean;
  path?: string;
  output_path?: string;
  message?: string;
  error?: string;
}

export async function saveDesignData(
  params: SaveDesignDataParams
): Promise<SaveDesignDataResult> {
  const { data, project_path, type } = params;
  
  // Set project path for logger
  setLoggerProjectPath(project_path);
  
  // Fixed output path as per rules
  const outputPath = join(project_path, '.pendrop/pendrop.data.ds.json');
  
  // Ensure directory exists
  await mkdir(dirname(outputPath), { recursive: true });

  // Read existing file or initialize
  let content: Record<string, any> = {};
  try {
    const fileContent = await readFile(outputPath, 'utf-8');
    content = JSON.parse(fileContent);
  } catch (error) {
    // File doesn't exist or is invalid, start with empty object
    content = {};
  }

  // Initialize the type section if it doesn't exist
  if (!content[type]) {
    content[type] = {};
  }

  // Merge new data into the specific section
  // We assume data is a map of ID -> Item (e.g., { "button": { ... } })
  content[type] = {
    ...content[type],
    ...data
  };
  
  // Write file
  await writeFile(outputPath, JSON.stringify(content, null, 2), 'utf-8');
  
  return {
    success: true,
    path: outputPath,
    output_path: outputPath,
    message: `✓ Design system data (${type}) saved/merged to ${outputPath}`
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
        description: 'The validated design data fragment to save (map of ID -> Item)'
      },
      project_path: { 
        type: 'string',
        description: 'Path to the project root'
      },
      type: {
        type: 'string',
        enum: ['tokens', 'components', 'stories'],
        description: 'The type of data being saved (components, tokens, stories)'
      }
    },
    required: ['data', 'project_path', 'type']
  }
};

