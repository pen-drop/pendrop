/**
 * Validation Tool
 * Validates transformed data against Pendrop schemas
 */

import { PendropValidator } from '../utils/validator.js';

export interface ValidateDesignDataParams {
  data: unknown;
  schema_type: 'ds' | 'content';
}

export interface ValidateDesignDataResult {
  success: boolean;
  valid: boolean;
  errors?: Array<{
    path: string;
    message: string;
    expected?: string;
  }>;
  message: string;
}

export async function validateDesignData(
  params: ValidateDesignDataParams
): Promise<ValidateDesignDataResult> {
  const { data, schema_type } = params;
  
  const validator = new PendropValidator();
  const validation = await validator.validate(data, schema_type);
  
  if (validation.valid) {
    return {
      success: true,
      valid: true,
      message: `✓ Data is valid ${schema_type === 'ds' ? 'pendrop.schema.ds.json' : 'pendrop.schema.content.json'}`
    };
  } else {
    return {
      success: true,
      valid: false,
      errors: validation.errors,
      message: `✗ Validation failed. Fix these errors and try again:\n${
        validation.errors?.map(e => `  - ${e.path}: ${e.message}`).join('\n')
      }`
    };
  }
}

/**
 * Tool definition for MCP
 */
export const validateDesignDataTool = {
  name: 'validate_design_data',
  description: 'Validate transformed design data against pendrop.schema.ds.json',
  inputSchema: {
    type: 'object',
    properties: {
      data: { 
        type: 'object',
        description: 'The transformed design data to validate'
      },
      schema_type: { 
        type: 'string',
        enum: ['ds', 'content'],
        default: 'ds',
        description: 'Schema type to validate against (ds for design system, content for content structure)'
      }
    },
    required: ['data']
  }
};

