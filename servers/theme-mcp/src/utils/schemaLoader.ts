/**
 * Schema Loader
 * Loads JSON schemas for validation
 */

import { readFile } from 'fs/promises';
import { readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface Schema {
  $schema?: string;
  [key: string]: unknown;
}

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
 * Schemas are always loaded from repository root, not from project_path
 */
function getRepositoryRoot(): string {
  const dir = getDirname();
  let currentDir = dir;
  
  // Traverse up maximum 6 levels to find repository root
  for (let i = 0; i < 6; i++) {
    try {
      // Check if this directory contains both 'servers' and 'schemas' folders
      const entries = readdirSync(currentDir);
      if (entries.includes('servers') && entries.includes('schemas')) {
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

/**
 * Load a Pendrop schema by type
 * Schemas are always loaded from repository root
 */
export async function loadSchema(schemaType: 'ds' | 'content'): Promise<Schema> {
  // Validate schema type
  if (schemaType !== 'ds' && schemaType !== 'content') {
    throw new Error(`Invalid schema type: ${schemaType}. Must be 'ds' or 'content'.`);
  }
  
  // Schemas are always loaded from repository root
  const repoRoot = getRepositoryRoot();
  const schemasRoot = join(repoRoot, 'schemas');
  const schemaName = schemaType === 'ds' ? 'pendrop.theme.json' : 'pendrop.content.json';
  const schemaPath = join(schemasRoot, schemaName);
  
  try {
    const content = await readFile(schemaPath, 'utf-8');
    return JSON.parse(content) as Schema;
  } catch (error) {
    throw new Error(`Failed to load schema from ${schemaPath}: ${error}`);
  }
}

