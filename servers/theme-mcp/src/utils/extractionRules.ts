/**
 * Extraction Rules Loader
 * Loads extraction packages (prompts + rules + examples) for design tools
 */

import { readFile } from 'fs/promises';
import { readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import type { PendropConfig } from './projectConfig.js';

function getDirname(): string {
  // In CommonJS/Jest context, __dirname is available
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  // In ESM context, use import.meta.url
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - import.meta is available in ESM
    const __filename = fileURLToPath(import.meta.url);
    return dirname(__filename);
  } catch {
    // Fallback for test environments
    return dirname(new URL(import.meta.url).pathname);
  }
}

/**
 * Get the Pendrop repository root directory
 * Traverses up from the current file location until it finds a directory
 * containing both 'servers' and 'rules' folders (repository markers)
 * 
 * Note: This is different from project_path, which is where pendrop.yml lives.
 * Rules are always loaded from the repository root, not from project_path.
 */
export function getRepositoryRoot(): string {
  const dir = getDirname();
  let currentDir = dir;
  
  // Traverse up maximum 6 levels to find repository root
  for (let i = 0; i < 6; i++) {
    try {
      // Check if this directory contains both 'servers' and 'rules' folders
      const entries = readdirSync(currentDir);
      if (entries.includes('servers') && entries.includes('rules')) {
        return currentDir;
      }
    } catch {
      // Continue traversing up if readdir fails
    }
    currentDir = resolve(currentDir, '..');
    
    // Safety check: stop if we've reached the filesystem root
    if (currentDir === resolve(currentDir, '..')) {
      break;
    }
  }
  
  // Fallback: use relative path calculation
  // From dist/utils: dist -> theme-mcp -> servers -> repository root (4 levels up)
  // From src/utils: src -> theme-mcp -> servers -> repository root (4 levels up)
  return resolve(dir, '../../../../');
}

export interface ExtractionRules {
  version: string;
  source: string;
  instructions: string;
  extraction_instructions?: string; // New field for tool-specific instructions
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
 * Load extraction rules
 * 
 * Uses extraction package name directly (e.g., 'pendrop-penpot')
 */
export async function loadExtractionRules(
  extractionPackage: string,
  projectPath: string,
  _pendropConfig?: PendropConfig
): Promise<ExtractionRules> {
  let packagePath: string;

  // Check if it's a local path
  if (extractionPackage.startsWith('./') || extractionPackage.startsWith('../') || extractionPackage.startsWith('/')) {
    // Local path relative to project root
    packagePath = resolve(projectPath, extractionPackage);
  } else if (extractionPackage.startsWith('@')) {
    // NPM package name - try to resolve from node_modules
    // For now, throw an error since npm resolution is complex
    throw new Error(`NPM package extraction rules not yet supported: ${extractionPackage}. Use local paths instead.`);
  } else {
    // Built-in package name (e.g., 'pendrop-penpot')
    // Rules are always loaded from repository root, not project_path
    const repoRoot = getRepositoryRoot();
    const rulesRoot = join(repoRoot, 'rules/theme/extraction');
    packagePath = join(rulesRoot, extractionPackage);
  }

  // Load extractions.yaml from the package
  const extractionsPath = join(packagePath, 'extractions.yaml');
  
  try {
    const content = await readFile(extractionsPath, 'utf-8');
    const rules = YAML.parse(content) as ExtractionRules;
    
    // Validate that source is present (but don't enforce specific value)
    if (!rules.source) {
      throw new Error(`Invalid extraction package: missing 'source' field in ${extractionsPath}`);
    }
    
    return rules;
  } catch (error) {
    throw new Error(`Failed to load extraction rules from ${extractionsPath}: ${error}`);
  }
}

/**
 * Load global instruction template
 * Located in rules/theme/extraction/instructions.yaml
 */
async function loadGlobalInstructions(): Promise<string> {
  // Rules are always loaded from repository root
  const repoRoot = getRepositoryRoot();
  const rulesRoot = join(repoRoot, 'rules/theme/extraction');
  const globalInstructionsPath = join(rulesRoot, 'instructions.yaml');
  
  try {
    const content = await readFile(globalInstructionsPath, 'utf-8');
    const parsed = YAML.parse(content) as { instructions?: string };
    
    if (!parsed.instructions) {
      throw new Error(`Missing 'instructions' field in ${globalInstructionsPath}`);
    }
    
    return parsed.instructions;
  } catch (error) {
    throw new Error(`Failed to load global instruction template from ${globalInstructionsPath}: ${error}`);
  }
}

/**
 * Load tool-specific extraction instructions
 * @deprecated Use loadExtractionRules and access extraction_instructions property instead
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadToolSpecificInstructions(
  extractionPackage: string,
  projectPath?: string,
  pendropConfig?: PendropConfig
): Promise<string> {
  // This function is kept for backward compatibility but should not be used
  // It now redirects to the new method via loadExtractionRules
  const rules = await loadExtractionRules(extractionPackage, projectPath || process.cwd(), pendropConfig);
  return rules.extraction_instructions || '';
}

/**
 * Load combined instruction template (global + tool-specific)
 * Combines global instructions with tool-specific extraction instructions
 */
export async function loadInstructionTemplate(
  extractionPackage: string,
  projectPath?: string,
  pendropConfig?: PendropConfig
): Promise<string> {
  // Load global instructions
  const globalInstructions = await loadGlobalInstructions();
  
  // Load extraction rules to get tool-specific instructions
  const rules = await loadExtractionRules(extractionPackage, projectPath || process.cwd(), pendropConfig);
  const toolSpecificInstructions = rules.extraction_instructions || '';
  
  if (!toolSpecificInstructions) {
    console.warn(`Warning: No 'extraction_instructions' found in extraction rules for ${extractionPackage}`);
  }
  
  // Replace the {{tool_specific_extraction_instructions}} placeholder in global instructions
  return globalInstructions.replace(
    '{{tool_specific_extraction_instructions}}',
    toolSpecificInstructions
  );
}

/**
 * Replace template variables in instruction template
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }
  
  return result;
}

/**
 * Load example files from extraction package
 */
export async function loadExamples(
  extractionPackage: string,
  projectPath?: string,
  _pendropConfig?: PendropConfig
): Promise<string> {
  let packagePath: string;

  // Use same logic as loadExtractionRules to find package
  if (extractionPackage.startsWith('./') || extractionPackage.startsWith('../') || extractionPackage.startsWith('/')) {
    packagePath = resolve(projectPath || process.cwd(), extractionPackage);
  } else {
    // Built-in package name (e.g., 'pendrop-penpot')
    const repoRoot = getRepositoryRoot();
    const rulesRoot = join(repoRoot, 'rules/theme/extraction');
    packagePath = join(rulesRoot, extractionPackage);
  }

  const examplesDir = join(packagePath, 'examples');
  
  try {
    // Load simple example input and output
    const inputPath = join(examplesDir, 'simple-input.json');
    const outputPath = join(examplesDir, 'simple-output.json');
    
    const inputContent = await readFile(inputPath, 'utf-8');
    const outputContent = await readFile(outputPath, 'utf-8');
    
    // Extract source tool name from package name (e.g., 'pendrop-penpot' -> 'penpot')
    const sourceTool = extractionPackage.replace(/^pendrop-/, '') || extractionPackage;
    
    return `
**Example Input (${sourceTool} data):**
\`\`\`json
${inputContent}
\`\`\`

**Example Output (pendrop.theme.json format):**
\`\`\`json
${outputContent}
\`\`\`
`;
  } catch (error) {
    // Examples are optional
    return 'No examples available.';
  }
}

