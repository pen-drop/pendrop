/**
 * Extraction Rules Loader
 * Loads extraction packages (prompts + rules + examples) for design tools
 */

import { readFile } from 'fs/promises';
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

export interface ExtractionRules {
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
 * Load extraction rules for a specific source tool
 * 
 * Priority:
 * 1. Custom package from pendrop.yml (rules.extraction.{tool})
 * 2. Built-in package (pendrop-{tool})
 */
export async function loadExtractionRules(
  sourceTool: string,
  projectPath: string,
  pendropConfig?: PendropConfig
): Promise<ExtractionRules> {
  let packagePath: string;

  // Check if custom extraction package is configured
  const customPackage = pendropConfig?.rules?.extraction?.[sourceTool];
  
  if (customPackage) {
    // Check if it's a local path or npm package
    if (customPackage.startsWith('./') || customPackage.startsWith('../') || customPackage.startsWith('/')) {
      // Local path relative to project root
      packagePath = resolve(projectPath, customPackage);
    } else if (customPackage.startsWith('@') || !customPackage.includes('/')) {
      // NPM package name - try to resolve from node_modules
      // For now, throw an error since npm resolution is complex
      throw new Error(`NPM package extraction rules not yet supported: ${customPackage}. Use local paths instead.`);
    } else {
      // Assume it's a relative path
      packagePath = resolve(projectPath, customPackage);
    }
  } else {
    // Use built-in package
    // Go up from servers/theme-mcp/src/utils to project root, then to rules/theme/extraction
    const rulesRoot = resolve(getDirname(), '../../../../rules/theme/extraction');
    packagePath = join(rulesRoot, `pendrop-${sourceTool}`);
  }

  // Load prompts.yaml from the package
  const promptsPath = join(packagePath, 'prompts.yaml');
  
  try {
    const content = await readFile(promptsPath, 'utf-8');
    const rules = YAML.parse(content) as ExtractionRules;
    
    if (!rules.source || rules.source !== sourceTool) {
      throw new Error(`Invalid extraction package: source mismatch (expected ${sourceTool}, got ${rules.source})`);
    }
    
    return rules;
  } catch (error) {
    throw new Error(`Failed to load extraction rules from ${promptsPath}: ${error}`);
  }
}

/**
 * Load example files from extraction package
 */
export async function loadExamples(
  sourceTool: string,
  projectPath?: string,
  pendropConfig?: PendropConfig
): Promise<string> {
  let packagePath: string;

  // Use same logic as loadExtractionRules to find package
  const customPackage = pendropConfig?.rules?.extraction?.[sourceTool];
  
  if (customPackage) {
    if (customPackage.startsWith('./') || customPackage.startsWith('../') || customPackage.startsWith('/')) {
      packagePath = resolve(projectPath || process.cwd(), customPackage);
    } else {
      throw new Error(`NPM package extraction rules not yet supported: ${customPackage}`);
    }
  } else {
    const rulesRoot = resolve(getDirname(), '../../../../rules/theme/extraction');
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

