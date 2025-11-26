/**
 * Data Validator
 * Validates data against Pendrop schemas using Ajv
 */

import Ajv from 'ajv';
import type { Schema } from './schemaLoader.js';
import { loadSchema } from './schemaLoader.js';

export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    path: string;
    message: string;
    expected?: string;
  }>;
}

export class PendropValidator {
  // Ajv instance - using any due to ESM import type issues with ajv v8
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ajv: any;
  private schemas: Map<string, Schema>;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AjvClass = Ajv as any;
    this.ajv = new AjvClass({ allErrors: true, verbose: true });
    this.schemas = new Map();
  }

  /**
   * Validate data against a Pendrop schema
   */
  async validate(
    data: unknown,
    schemaType: 'ds' | 'content'
  ): Promise<ValidationResult> {
    // Load schema if not cached
    if (!this.schemas.has(schemaType)) {
      const schema = await loadSchema(schemaType);
      this.schemas.set(schemaType, schema);
      this.ajv.addSchema(schema, schemaType);
    }

    const valid = this.ajv.validate(schemaType, data);

    if (valid) {
      return { valid: true };
    }

    // Format errors
    const errors = (this.ajv.errors || []).map((err: { instancePath?: string; message?: string; params?: unknown }) => ({
      path: err.instancePath || '/',
      message: err.message || 'Validation error',
      expected: err.params ? JSON.stringify(err.params) : undefined,
    }));

    return { valid: false, errors };
  }
}

