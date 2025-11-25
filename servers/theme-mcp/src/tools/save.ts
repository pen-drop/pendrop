/**
 * Save Tool
 * Saves validated design data to project
 */

import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { setLoggerProjectPath } from '../utils/mcpLogger.js';
import { PendropValidator } from '../utils/validator.js';

export interface SaveDesignDataParams {
  data: Record<string, unknown>;
  project_path: string; // Path to directory containing pendrop.yml (project root)
  type: 'tokens' | 'components' | 'stories';
  dryrun?: boolean; // If true, only validate without saving
}

export interface SaveDesignDataResult {
  success: boolean;
  path?: string;
  output_path?: string;
  message?: string;
  error?: string;
  valid?: boolean;
  errors?: Array<{
    path: string;
    message: string;
    expected?: string;
  }>;
}

export async function saveDesignData(
  params: SaveDesignDataParams
): Promise<SaveDesignDataResult> {
  const { data, project_path, type, dryrun = false } = params;
  
  // Set project path for logger
  setLoggerProjectPath(project_path);
  
  // Fixed output path as per rules
  const outputPath = join(project_path, '.pendrop/dist/pendrop.data.ds.json');
  
  // Ensure directory exists (only if not dryrun)
  if (!dryrun) {
    await mkdir(dirname(outputPath), { recursive: true });
  }

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
  
  // Always validate the merged content before saving
  const validator = new PendropValidator();
  const validation = await validator.validate(content, 'ds');
  
  if (!validation.valid) {
    // Validation failed - return error without saving
    return {
      success: false,
      valid: false,
      errors: validation.errors,
      error: `Validation failed. Fix these errors and try again:\n${
        validation.errors?.map(e => `  - ${e.path}: ${e.message}`).join('\n')
      }`,
      message: `✗ Validation failed for design system data (${type})`
    };
  }
  
  // If dryrun is true, return validation result without saving
  if (dryrun) {
    return {
      success: true,
      valid: true,
      message: `✓ Design system data (${type}) is valid (dryrun mode - not saved)`
    };
  }
  
  // Validation succeeded - write file
  await writeFile(outputPath, JSON.stringify(content, null, 2), 'utf-8');
  
  return {
    success: true,
    path: outputPath,
    output_path: outputPath,
    valid: true,
    message: `✓ Design system data (${type}) saved/merged to ${outputPath}`
  };
}

/**
 * Tool definition for MCP
 */
export const saveDesignDataTool = {
  name: 'save_design_data',
  description: 'Save validated design data to .pendrop/dist/. Always validates before saving. If dryrun is true, only validates without saving.',
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
      },
      dryrun: {
        type: 'boolean',
        default: false,
        description: 'If true, only validate without saving'
      }
    },
    required: ['data', 'project_path', 'type']
  }
};

