/**
 * Unified Types for Assets and Variables
 * Used across pendrop.yml, pipeline.yaml, and tasks.yml
 */

export interface AssetDefinition {
  url?: string;  // HTTP/HTTPS URL
  path?: string; // Local file path (supports {{variables}})
  writeable: boolean;
  schema?: string | null; // Optional schema URL for validation
}

export type Assets = Record<string, AssetDefinition>;

export type Variables = Record<string, any>;

export interface ConfigSection {
  assets?: Assets;
  variables?: Variables;
}

