/**
 * Transformation Rules Loader
 * Loads transformation packages (prompts + rules + examples) for design tools
 */

import { readFile } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import type { PendropConfig } from './projectConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TransformRules {
  version: string;
  source: string;
  instructions: string;
  tokens_instructions: string;
  components_instructions: string;
  stories_instructions?: string;
  naming?: {
    tokens?: string;
    components?: string;
    props?: string;
  };
  hints?: string[];
}

/**
 * Load transformation rules for a specific source tool
 * 
 * Priority:
 * 1. Custom package from pendrop.yml (rules.transformations.{tool})
 * 2. Built-in package (pendrop-{tool})
 */
export async function loadTransformRules(
  sourceTool: string,
  projectPath: string,
  pendropConfig?: PendropConfig
): Promise<TransformRules> {
  let packagePath: string;

  // Check if custom transformation package is configured
  const customPackage = pendropConfig?.rules?.transformations?.[sourceTool];
  
  if (customPackage) {
    // Check if it's a local path or npm package
    if (customPackage.startsWith('./') || customPackage.startsWith('../') || customPackage.startsWith('/')) {
      // Local path relative to project root
      packagePath = resolve(projectPath, customPackage);
    } else if (customPackage.startsWith('@') || !customPackage.includes('/')) {
      // NPM package name - try to resolve from node_modules
      // For now, throw an error since npm resolution is complex
      throw new Error(`NPM package transformation rules not yet supported: ${customPackage}. Use local paths instead.`);
    } else {
      // Assume it's a relative path
      packagePath = resolve(projectPath, customPackage);
    }
  } else {
    // Use built-in package
    // Go up from servers/theme-mcp/src/utils to project root, then to rules/transformations
    const rulesRoot = resolve(__dirname, '../../../../rules/transformations');
    packagePath = join(rulesRoot, `pendrop-${sourceTool}`);
  }

  // Load prompts.yaml from the package
  const promptsPath = join(packagePath, 'prompts.yaml');
  
  try {
    const content = await readFile(promptsPath, 'utf-8');
    const rules = YAML.parse(content) as TransformRules;
    
    if (!rules.source || rules.source !== sourceTool) {
      throw new Error(`Invalid transformation package: source mismatch (expected ${sourceTool}, got ${rules.source})`);
    }
    
    return rules;
  } catch (error) {
    throw new Error(`Failed to load transformation rules from ${promptsPath}: ${error}`);
  }
}

/**
 * Load example files from transformation package
 */
export async function loadExamples(
  sourceTool: string,
  projectPath?: string,
  pendropConfig?: PendropConfig
): Promise<string> {
  let packagePath: string;

  // Use same logic as loadTransformRules to find package
  const customPackage = pendropConfig?.rules?.transformations?.[sourceTool];
  
  if (customPackage) {
    if (customPackage.startsWith('./') || customPackage.startsWith('../') || customPackage.startsWith('/')) {
      packagePath = resolve(projectPath || process.cwd(), customPackage);
    } else {
      throw new Error(`NPM package transformation rules not yet supported: ${customPackage}`);
    }
  } else {
    const rulesRoot = resolve(__dirname, '../../../../rules/transformations');
    packagePath = join(rulesRoot, `pendrop-${sourceTool}`);
  }

  const examplesDir = join(packagePath, 'examples');
  
  try {
    // Load simple example input and output
    const inputPath = join(examplesDir, 'simple-input.json');
    const outputPath = join(examplesDir, 'simple-output.json');
    
    const inputContent = await readFile(inputPath, 'utf-8');
    const outputContent = await readFile(outputPath, 'utf-8');
    
    return `
**Example Input (${sourceTool} data):**
\`\`\`json
${inputContent}
\`\`\`

**Example Output (pendrop.data.ds.json format):**
\`\`\`json
${outputContent}
\`\`\`
`;
  } catch (error) {
    // Examples are optional
    return 'No examples available.';
  }
}

