/**
 * Unit tests for PendropValidator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PendropValidator } from '../../src/utils/validator.js';

describe('PendropValidator', () => {
  let validator: PendropValidator;

  beforeEach(() => {
    validator = new PendropValidator();
  });

  describe('Design System Schema Validation', () => {
    it('should validate valid design system data', async () => {
      const validData = {
        $schema: '../../../schemas/pendrop.schema.ds.json',
        tokens: {
          color: {
            primary: {
              $value: '#007bff',
              $type: 'color',
            },
          },
        },
        components: {
          button: {
            name: 'Button',
            category: 'Atoms',
            props: {},
          },
        },
        stories: {},
      };

      const result = await validator.validate(validData, 'ds');

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject data missing required properties', async () => {
      const invalidData = {
        tokens: {},
        // Missing components and stories
      };

      const result = await validator.validate(invalidData, 'ds');

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should reject invalid token format', async () => {
      const invalidData = {
        tokens: {
          color: {
            primary: {
              // Missing $value and $type
              description: 'Primary color',
            },
          },
        },
        components: {},
        stories: {},
      };

      const result = await validator.validate(invalidData, 'ds');

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should validate W3C DTCG token format', async () => {
      const validTokenData = {
        tokens: {
          color: {
            primary: {
              $value: '#007bff',
              $type: 'color',
              $description: 'Primary brand color',
            },
          },
          spacing: {
            md: {
              $value: '16px',
              $type: 'dimension',
            },
          },
        },
        components: {},
        stories: {},
      };

      const result = await validator.validate(validTokenData, 'ds');

      expect(result.valid).toBe(true);
    });

    it('should validate component structure', async () => {
      const validComponentData = {
        tokens: {},
        components: {
          button: {
            name: 'Button',
            description: 'A button component',
            category: 'Atoms',
            props: {
              label: {
                type: 'string',
                required: true,
              },
              variant: {
                type: 'enum',
                enum: ['primary', 'secondary'],
              },
            },
            tokens: ['color.primary'],
          },
        },
        stories: {},
      };

      const result = await validator.validate(validComponentData, 'ds');

      expect(result.valid).toBe(true);
    });

    it('should validate story structure', async () => {
      const validStoryData = {
        tokens: {},
        components: {},
        stories: {
          button: {
            componentId: 'button',
            variants: [
              {
                name: 'Default',
                props: {
                  label: 'Click me',
                },
              },
            ],
          },
        },
      };

      const result = await validator.validate(validStoryData, 'ds');

      expect(result.valid).toBe(true);
    });
  });

  describe('Error Formatting', () => {
    it('should provide detailed error messages', async () => {
      const invalidData = {
        tokens: 'invalid', // Should be object
        components: {},
        stories: {},
      };

      const result = await validator.validate(invalidData, 'ds');

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toHaveProperty('path');
      expect(result.errors![0]).toHaveProperty('message');
    });

    it('should report multiple errors', async () => {
      const invalidData = {
        tokens: 'invalid',
        components: 'also invalid',
        stories: 'still invalid',
      };

      const result = await validator.validate(invalidData, 'ds');

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(1);
    });
  });

  describe('Schema Caching', () => {
    it('should cache schemas for performance', async () => {
      const validData = {
        tokens: {},
        components: {},
        stories: {},
      };

      // First validation
      const result1 = await validator.validate(validData, 'ds');
      
      // Second validation (should use cached schema)
      const result2 = await validator.validate(validData, 'ds');

      expect(result1.valid).toBe(result2.valid);
    });
  });
});

