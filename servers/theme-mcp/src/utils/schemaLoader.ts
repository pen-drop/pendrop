/**
 * Schema Loader
 * Loads JSON schemas for validation
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { getRepositoryRoot } from './paths.js';

export interface Schema {
  $schema?: string;
  [key: string]: unknown;
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
  
  const repoRoot = getRepositoryRoot();
  
  let schemaPath: string;
  
  if (schemaType === 'ds') {
    // Theme schema moved to composer pipeline
    schemaPath = join(repoRoot, 'composer/pipelines/pendrop-design-extract/schema.json');
  } else {
    // Content schema remains in schemas/
    schemaPath = join(repoRoot, 'schemas/pendrop.content.json');
  }
  
  try {
    const content = await readFile(schemaPath, 'utf-8');
    return JSON.parse(content) as Schema;
  } catch (error) {
    throw new Error(`Failed to load schema from ${schemaPath}: ${error}`);
  }
}
