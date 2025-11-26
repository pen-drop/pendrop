/**
 * Design Extraction Tool
 * Returns AI instructions for extracting and transforming design data
 */

import { join } from 'path';
import { loadPendropConfig, resolvePaths } from '../utils/projectConfig.js';
import { loadExtractionRules, loadExamples, loadInstructionTemplate, replaceTemplateVariables, getRepositoryRoot } from '../utils/extractionRules.js';
import { loadSchema } from '../utils/schemaLoader.js';
import { loadConventions } from '../utils/conventions.js';
import { setLoggerProjectPath } from '../utils/mcpLogger.js';

function getRulesPath(): string {
  // Get rules path from repository root
  return join(getRepositoryRoot(), 'rules/theme');
}

export interface ExtractDesignParams {
  design_url: string;
  extraction_rules?: string; // Optional: extraction package name (e.g., 'pendrop-penpot'). If not provided, reads from rules.extraction in pendrop.yml
  project_path: string; // Path to directory containing pendrop.yml (project root)
  options?: {
    includeHiddenLayers?: boolean;
    [key: string]: unknown;
  };
}

export interface ExtractDesignResult {
  success: boolean;
  instructions: string;
  rules?: unknown;
  examples?: string;
  error?: string;
}

/**
 * Extract design data from URL
 * Returns AI instructions for extracting and transforming design data
 */
export async function extractDesign(
  params: ExtractDesignParams
): Promise<ExtractDesignResult> {
  const { design_url, extraction_rules, project_path, options: _options = {} } = params;
  
  // Set project path for logger
  setLoggerProjectPath(project_path);
  
  try {
    // 1. Load project config
    const pendropConfig = await loadPendropConfig(project_path);
    
    // 2. Determine extraction package name (from param or config)
    const extractionPackage = extraction_rules || pendropConfig.rules?.extraction;
    
    if (!extractionPackage) {
      return {
        success: false,
        error: `extraction_rules is required. Please specify the extraction package name (e.g., 'pendrop-penpot') or configure it in pendrop.yml: rules.extraction`,
        instructions: '',
      };
    }
    
    // 3. Load extraction rules (uses extraction package name)
    const rules = await loadExtractionRules(extractionPackage, project_path, pendropConfig);
    
    // 4. Load examples
    const examples = await loadExamples(extractionPackage, project_path, pendropConfig);
    
    // 5. Load target schema
    const schema = await loadSchema('ds');
    
    // 6. Determine output path
    const rulesPath = getRulesPath();
    const conventions = await loadConventions({
      target: pendropConfig.project.type,
      rulesPath,
      projectRules: pendropConfig.rules?.custom_rules_path
    });
    const resolvedConventions = resolvePaths(
      conventions,
      pendropConfig.project.theme
    );
    const outputPath = join(project_path, (resolvedConventions.paths as Record<string, string>)?.design_data || '.pendrop/dist/pendrop.data.ds.json');
    
    // 7. Load instruction template from extraction package
    const instructionTemplate = await loadInstructionTemplate(extractionPackage, project_path, pendropConfig);
    
    // 8. Replace template variables with actual values
    const instructions = replaceTemplateVariables(instructionTemplate, {
      source_tool: rules.source, // Use source from loaded rules
      design_url: design_url,
      project_path: project_path,
      output_path: outputPath,
      target_schema: JSON.stringify(schema, null, 2),
      extraction_rules: rules.instructions,
      tokens_instructions: rules.tokens_instructions,
      components_instructions: rules.components_instructions,
      stories_instructions: rules.stories_instructions || 'Generate default story variants for each component.',
      naming_tokens: rules.naming?.tokens || 'kebab-case',
      naming_components: rules.naming?.components || 'kebab-case',
      naming_props: rules.naming?.props || 'camelCase',
      examples: examples || 'No examples provided.'
    });

    return {
      success: true,
      instructions,
      rules,
      examples
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage,
      instructions: '',
    };
  }
}

/**
 * Tool definition for MCP
 */
export const extractDesignTool = {
  name: 'extract_design',
  description: 'Get instructions for extracting and transforming a design file to pendrop format. Returns a prompt with steps for AI to execute.',
  inputSchema: {
    type: 'object',
    properties: {
      design_url: {
        type: 'string',
        description: 'URL to design file'
      },
      extraction_rules: {
        type: 'string',
        description: 'Extraction package name (e.g., pendrop-penpot, pendrop-figma). If not provided, reads from rules.extraction in pendrop.yml.'
      },
      project_path: {
        type: 'string',
        description: 'Path to directory containing pendrop.yml (project root)'
      },
      options: {
        type: 'object',
        description: 'Optional extraction options',
        properties: {
          includeHiddenLayers: {
            type: 'boolean',
            description: 'Include hidden layers in extraction',
          },
        },
      },
    },
    required: ['project_path'],
    anyOf: [
      { required: ['design_url'] },
      { required: ['fileUrl'] }
    ]
  }
};

