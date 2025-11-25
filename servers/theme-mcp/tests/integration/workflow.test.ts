/**
 * Integration tests for complete transformation workflow
 */

import { describe, it, expect } from '@jest/globals';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PendropValidator } from '../../src/utils/validator.js';
import { loadTransformRules } from '../../src/utils/transformRules.js';

describe('Transformation Workflow Integration', () => {
  let validator: PendropValidator;

  beforeAll(() => {
    validator = new PendropValidator();
  });

  describe('End-to-End Transformation', () => {
    it('should validate transformed fixture data', async () => {
      // Load the transformed fixture
      const fixturePath = join(__dirname, '../fixtures/penpot-transformed.json');
      const fixtureContent = await readFile(fixturePath, 'utf-8');
      const transformedData = JSON.parse(fixtureContent);

      // Validate against design system schema
      const result = await validator.validate(transformedData, 'ds');

      expect(result.valid).toBe(true);
      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
    });

    it('should have valid tokens in transformed data', async () => {
      const fixturePath = join(__dirname, '../fixtures/penpot-transformed.json');
      const fixtureContent = await readFile(fixturePath, 'utf-8');
      const transformedData = JSON.parse(fixtureContent);

      expect(transformedData.tokens).toBeDefined();
      expect(transformedData.tokens.color).toBeDefined();
      expect(transformedData.tokens.spacing).toBeDefined();
      expect(transformedData.tokens.typography).toBeDefined();

      // Check W3C DTCG format
      const primaryColor = transformedData.tokens.color.primary;
      expect(primaryColor).toHaveProperty('$value');
      expect(primaryColor).toHaveProperty('$type');
      expect(primaryColor.$type).toBe('color');
    });

    it('should have valid components in transformed data', async () => {
      const fixturePath = join(__dirname, '../fixtures/penpot-transformed.json');
      const fixtureContent = await readFile(fixturePath, 'utf-8');
      const transformedData = JSON.parse(fixtureContent);

      expect(transformedData.components).toBeDefined();
      expect(transformedData.components.button).toBeDefined();
      
      const button = transformedData.components.button;
      expect(button).toHaveProperty('name');
      expect(button).toHaveProperty('category');
      expect(button).toHaveProperty('props');
      expect(button.category).toBe('Atoms');
    });

    it('should have valid stories in transformed data', async () => {
      const fixturePath = join(__dirname, '../fixtures/penpot-transformed.json');
      const fixtureContent = await readFile(fixturePath, 'utf-8');
      const transformedData = JSON.parse(fixtureContent);

      expect(transformedData.stories).toBeDefined();
      expect(transformedData.stories.button).toBeDefined();
      
      const buttonStories = transformedData.stories.button;
      expect(buttonStories).toHaveProperty('componentId');
      expect(buttonStories).toHaveProperty('variants');
      expect(Array.isArray(buttonStories.variants)).toBe(true);
      expect(buttonStories.variants.length).toBeGreaterThan(0);
    });
  });

  describe('Transformation Rules Application', () => {
    it('should load transformation rules successfully', async () => {
      const rules = await loadTransformRules('penpot', '/fake/path');

      expect(rules).toBeDefined();
      expect(rules.version).toBe('1.0');
      expect(rules.source).toBe('penpot');
    });

    it('should provide instructions for token extraction', async () => {
      const rules = await loadTransformRules('penpot', '/fake/path');

      expect(rules.tokens_instructions).toBeDefined();
      expect(rules.tokens_instructions).toContain('color');
      expect(rules.tokens_instructions).toContain('spacing');
      expect(rules.tokens_instructions).toContain('typography');
    });

    it('should provide instructions for component extraction', async () => {
      const rules = await loadTransformRules('penpot', '/fake/path');

      expect(rules.components_instructions).toBeDefined();
      expect(rules.components_instructions.toLowerCase()).toContain('component');
      expect(rules.components_instructions.toLowerCase()).toContain('props');
    });

    it('should specify naming conventions', async () => {
      const rules = await loadTransformRules('penpot', '/fake/path');

      expect(rules.naming).toBeDefined();
      expect(rules.naming?.tokens).toBe('kebab-case');
      expect(rules.naming?.components).toBe('kebab-case');
      expect(rules.naming?.props).toBe('camelCase');
    });
  });

  describe('Data Flow Validation', () => {
    it('should demonstrate raw → transformed flow', async () => {
      // Load raw fixture
      const rawPath = join(__dirname, '../fixtures/penpot-raw.json');
      const rawContent = await readFile(rawPath, 'utf-8');
      const rawData = JSON.parse(rawContent);

      // Load transformed fixture
      const transformedPath = join(__dirname, '../fixtures/penpot-transformed.json');
      const transformedContent = await readFile(transformedPath, 'utf-8');
      const transformedData = JSON.parse(transformedContent);

      // Verify transformation captured key data
      expect(rawData.pages).toBeDefined();
      expect(transformedData.tokens).toBeDefined();
      expect(transformedData.components).toBeDefined();

      // Verify specific transformations
      // Raw has "primary-color" object -> Transformed has color.primary token
      const hasPrimaryColorRaw = rawData.pages.some((page: any) =>
        page.objects.some((obj: any) => obj.name === 'primary-color')
      );
      expect(hasPrimaryColorRaw).toBe(true);
      expect(transformedData.tokens.color.primary).toBeDefined();
    });

    it('should preserve component relationships', async () => {
      const transformedPath = join(__dirname, '../fixtures/penpot-transformed.json');
      const transformedContent = await readFile(transformedPath, 'utf-8');
      const transformedData = JSON.parse(transformedContent);

      // Button component should reference tokens
      const button = transformedData.components.button;
      expect(button.tokens).toBeDefined();
      expect(Array.isArray(button.tokens)).toBe(true);
      expect(button.tokens.length).toBeGreaterThan(0);

      // Verify referenced tokens exist
      for (const tokenRef of button.tokens) {
        const [category, name] = tokenRef.split('.');
        expect(transformedData.tokens[category]).toBeDefined();
        expect(transformedData.tokens[category][name]).toBeDefined();
      }
    });

    it('should link stories to components', async () => {
      const transformedPath = join(__dirname, '../fixtures/penpot-transformed.json');
      const transformedContent = await readFile(transformedPath, 'utf-8');
      const transformedData = JSON.parse(transformedContent);

      // Each story should reference a valid component
      for (const [storyId, story] of Object.entries(transformedData.stories)) {
        const componentId = (story as any).componentId;
        expect(componentId).toBeDefined();
        expect(transformedData.components[componentId]).toBeDefined();
      }
    });
  });

  describe('Schema Compliance', () => {
    it('should validate against pendrop.theme.json', async () => {
      const transformedPath = join(__dirname, '../fixtures/penpot-transformed.json');
      const transformedContent = await readFile(transformedPath, 'utf-8');
      const transformedData = JSON.parse(transformedContent);

      const result = await validator.validate(transformedData, 'ds');

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should have valid W3C DTCG token structure', async () => {
      const transformedPath = join(__dirname, '../fixtures/penpot-transformed.json');
      const transformedContent = await readFile(transformedPath, 'utf-8');
      const transformedData = JSON.parse(transformedContent);

      // Check all tokens have W3C DTCG structure
      for (const [category, tokens] of Object.entries(transformedData.tokens)) {
        for (const [name, token] of Object.entries(tokens as any)) {
          if (typeof token === 'object' && token !== null && '$value' in token) {
            expect(token).toHaveProperty('$value');
            expect(token).toHaveProperty('$type');
          }
        }
      }
    });
  });
});

