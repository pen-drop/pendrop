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
 * Load a Pendrop schema by type
 */
export async function loadSchema(schemaType: 'ds' | 'content'): Promise<Schema> {
  // Validate schema type
  if (schemaType !== 'ds' && schemaType !== 'content') {
    throw new Error(`Invalid schema type: ${schemaType}. Must be 'ds' or 'content'.`);
  }
  
  // Go up from servers/theme-mcp/src/utils to project root, then to schemas
  const schemasRoot = resolve(getDirname(), '../../../../schemas');
  const schemaName = schemaType === 'ds' ? 'pendrop.theme.json' : 'pendrop.content.json';
  const schemaPath = join(schemasRoot, schemaName);
  
  try {
    const content = await readFile(schemaPath, 'utf-8');
    return JSON.parse(content) as Schema;
  } catch (error) {
    throw new Error(`Failed to load schema from ${schemaPath}: ${error}`);
  }
}

