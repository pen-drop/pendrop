/**
 * Extraction Instructions Tool
 * Returns AI prompts/instructions for extracting and transforming design data
 */

import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadPendropConfig, resolvePaths } from '../utils/projectConfig.js';
import { loadExtractionRules, loadExamples, loadInstructionTemplate, replaceTemplateVariables } from '../utils/extractionRules.js';
import { loadSchema } from '../utils/schemaLoader.js';
import { loadConventions } from '../utils/conventions.js';

function getRulesPath(): string {
  // Get absolute path to rules/theme from this file location
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return resolve(__dirname, '../../../rules/theme');
}

export interface ExtractDesignSystemParams {
  design_url: string;
  source_tool: string;
  project_path: string;
}

export interface ExtractDesignSystemResult {
  success: boolean;
  instructions: string;
  mcp_calls: Array<{
    mcp: string;
    tool: string;
    params: unknown;
  }>;
  rules?: unknown;
  examples?: string;
}

export async function getExtractionInstructions(
  params: ExtractDesignSystemParams
): Promise<ExtractDesignSystemResult> {
  const { design_url, source_tool, project_path } = params;
  
  // 1. Load project config
  const pendropConfig = await loadPendropConfig(project_path);
  
  // 2. Load extraction rules
  const rules = await loadExtractionRules(source_tool, project_path, pendropConfig);
  
  // 3. Load examples
  const examples = await loadExamples(source_tool, project_path, pendropConfig);
  
  // 4. Load target schema
  const schema = await loadSchema('ds');
  
  // 5. Determine output path
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
  
  // 6. Load instruction template from extraction package
  const instructionTemplate = await loadInstructionTemplate(source_tool, project_path, pendropConfig);
  
  // 7. Replace template variables with actual values
  const instructions = replaceTemplateVariables(instructionTemplate, {
    source_tool,
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
    mcp_calls: [
      {
        mcp: `${source_tool}-mcp`,
        tool: 'extract_file',
        params: { file_url: design_url }
      },
      {
        mcp: 'theme-mcp',
        tool: 'validate_design_data',
        params: { data: '<transformed>', schema_type: 'ds' }
      },
      {
        mcp: 'theme-mcp',
        tool: 'save_design_data',
        params: { data: '<validated>', project_path }
      }
    ],
    rules,
    examples
  };
}

/**
 * Tool definition for MCP
 */
export const extractDesignSystemTool = {
  name: 'extract_design_system',
  description: 'Get instructions for extracting and transforming a design file to pendrop format. Returns a prompt with steps for AI to execute.',
  inputSchema: {
    type: 'object',
    properties: {
      design_url: {
        type: 'string',
        description: 'URL to design file'
      },
      source_tool: {
        type: 'string',
        description: 'Source design tool (e.g., penpot, figma, sketch, adobexd)'
      },
      project_path: {
        type: 'string',
        description: 'Path to Drupal project root'
      }
    },
    required: ['design_url', 'source_tool', 'project_path']
  }
};

