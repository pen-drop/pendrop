/**
 * Unit tests for Schema Loader
 */

import { describe, it, expect } from 'vitest';
import { loadSchema } from '../../src/utils/schemaLoader.js';

describe('Schema Loader', () => {
  describe('loadSchema', () => {
    it('should load design system schema', async () => {
      const schema = await loadSchema('ds');

      expect(schema).toBeDefined();
      expect(schema.$schema).toBeDefined();
      expect(schema.type).toBe('object');
    });

    it('should load content schema', async () => {
      const schema = await loadSchema('content');

      expect(schema).toBeDefined();
      expect(schema.$schema).toBeDefined();
      expect(schema.type).toBe('object');
    });

    it('should return valid JSON schema structure', async () => {
      const schema = await loadSchema('ds');

      expect(schema).toHaveProperty('type');
      expect(schema).toHaveProperty('properties');
    });

    it('should throw error for invalid schema type', async () => {
      await expect(async () => {
        // @ts-expect-error Testing invalid input
        await loadSchema('invalid');
      }).rejects.toThrow();
    });

    it('should load schema with all required properties', async () => {
      const schema = await loadSchema('ds');

      expect(schema.properties).toBeDefined();
      expect(schema.properties).toHaveProperty('tokens');
      expect(schema.properties).toHaveProperty('components');
      expect(schema.properties).toHaveProperty('stories');
    });
  });

  describe('Schema Caching', () => {
    it('should load schema successfully multiple times', async () => {
      const schema1 = await loadSchema('ds');
      const schema2 = await loadSchema('ds');

      expect(schema1).toEqual(schema2);
    });
  });
});

