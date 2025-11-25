/**
 * Schema Loader
 * Loads JSON schemas for validation
 */

import { readFile } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface Schema {
  $schema?: string;
  [key: string]: unknown;
}

function getDirname(): string {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  const __filename = fileURLToPath(import.meta.url);
  return dirname(__filename);
}

/**
 * Load a Pendrop schema by type
 */
export async function loadSchema(schemaType: 'ds' | 'content'): Promise<Schema> {
  // Go up from servers/theme-mcp/src/utils to project root, then to schemas
  const schemasRoot = resolve(getDirname(), '../../../../schemas');
  const schemaPath = join(schemasRoot, `pendrop.schema.${schemaType}.json`);
  
  try {
    const content = await readFile(schemaPath, 'utf-8');
    return JSON.parse(content) as Schema;
  } catch (error) {
    throw new Error(`Failed to load schema from ${schemaPath}: ${error}`);
  }
}

