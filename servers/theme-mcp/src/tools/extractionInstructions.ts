/**
 * Extraction Instructions Tool
 * Returns AI prompts/instructions for extracting and transforming design data
 */

import { join } from 'path';
import { loadPendropConfig, resolvePaths } from '../utils/projectConfig.js';
import { loadExtractionRules, loadExamples } from '../utils/extractionRules.js';
import { loadSchema } from '../utils/schemaLoader.js';
import { loadConventions } from '../utils/conventions.js';

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
  const conventions = await loadConventions({
    target: pendropConfig.project.type,
    rulesPath: '../../rules/theme',
    projectRules: pendropConfig.rules?.custom_rules_path
  });
  const resolvedConventions = resolvePaths(
    conventions,
    pendropConfig.project.theme
  );
  const outputPath = join(project_path, (resolvedConventions.paths as Record<string, string>).design_data || '.pendrop/dist/pendrop.data.ds.json');
  
  // 7. Build instructions prompt
  const instructions = `
# Design System Extraction Instructions

You are extracting and transforming a ${source_tool} design file to Pendrop's design system format.

## Step 1: Extract Source Data

Call the ${source_tool}-mcp server to extract the design file:

\`\`\`
${source_tool}-mcp.extract_file({
  file_url: "${design_url}"
})
\`\`\`

**Note:** Authentication is handled by the ${source_tool}-mcp server itself (via environment variables or its own configuration).

This will return raw ${source_tool} data.

## Step 2: Transform Data

Transform the raw data to \`pendrop.theme.json\` format following these rules:

### Target Schema

Your output must match this schema:

\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`

### Extraction Rules

${rules.instructions}

### Token Extraction

${rules.tokens_instructions}

Extract design tokens in **W3C DTCG format**:
- Use \`$value\`, \`$type\`, \`$description\` properties
- Token types: color, dimension, fontFamily, fontSize, etc.

### Component Extraction

${rules.components_instructions}

### Story Generation

${rules.stories_instructions || 'Generate default story variants for each component.'}

### Naming Conventions

- Tokens: ${rules.naming?.tokens || 'kebab-case'}
- Components: ${rules.naming?.components || 'kebab-case'}
- Props: ${rules.naming?.props || 'camelCase'}

### Examples

${examples || 'No examples provided.'}

## Step 3: Validate Result

Call theme-mcp to validate your transformed data:

\`\`\`
theme-mcp.validate_design_data({
  data: <your_transformed_data>,
  schema_type: "ds"
})
\`\`\`

If validation fails, review the errors and fix the data structure.

## Step 4: Save Result

Once validated, save the data:

\`\`\`
theme-mcp.save_design_data({
  data: <validated_data>,
  project_path: "${project_path}"
})
\`\`\`

This will save to: ${outputPath}

## Summary

1. Extract from ${source_tool}-mcp
2. Transform using rules above
3. Validate with theme-mcp
4. Save with theme-mcp

Execute these steps now.
`;

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

