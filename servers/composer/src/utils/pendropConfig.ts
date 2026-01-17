/**
 * Project Configuration Management
 * Loads and parses pendrop.yml from project root
 */

import { join, resolve, dirname } from 'path';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import { yamlLoader } from './yamlLoader.js';
import { deepMerge } from './assetManager.js';
import type { ConfigSection } from '../types/config.js';
import type { WorkflowDefinition } from './workflowLoader.js';

export interface PendropConfig extends ConfigSection {
  workflows?: Record<string, WorkflowDefinition>;
  design?: any;
  rules?: any;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Validator
const ajv = new (Ajv as any)({ strict: false }); 
let validate: any = null;

async function getValidator() {
  if (validate) return validate;

  // Resolve schema path relative to this file
  const schemaPath = resolve(__dirname, '../../../../schemas/pendrop.config.json');
  
  try {
    const schemaContent = await readFile(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);
    validate = ajv.compile(schema);
    return validate;
  } catch (error) {
    console.warn(`Failed to load validation schema from ${schemaPath}: ${error}`);
    return () => true;
  }
}

/**
 * Load pendrop.yml configuration from project root
 * @param projectPath - Path to the directory containing pendrop.yml (project root)
 * @param configFilename - Optional: Name of the configuration file (default: pendrop.yml)
 */
export async function loadPendropConfig(projectPath: string, configFilename: string = 'pendrop.yml'): Promise<PendropConfig> {
  const configPath = join(projectPath, configFilename);
  
  try {
    // Use yamlLoader to support !include
    const config = await yamlLoader.load(configPath, configPath);
    
    // Validate
    const validator = await getValidator();
    const valid = validator(config);
    if (!valid) {
      const errors = validator.errors?.map((e: any) => `${e.instancePath} ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${errors}`);
    }

    // Expand workflows with 'source' property (Inheritance)
    if (config.workflows) {
      for (const [name, workflow] of Object.entries(config.workflows)) {
        const def = workflow as any;
        if (def.source && typeof def.source === 'string') {
          try {
            // Load base workflow from source path (relative to config file)
            const base = await yamlLoader.load(def.source, configPath);
            // Deep merge: Local definition overrides Base definition
            config.workflows[name] = deepMerge(base, def);
          } catch (e) {
            throw new Error(`Failed to load workflow source '${def.source}' for workflow '${name}': ${e}`);
          }
        }
      }
    }

    return config as PendropConfig;
  } catch (error) {
    throw new Error(`Failed to load configuration from ${configPath}: ${error}`);
  }
}
