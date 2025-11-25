/**
 * Integration tests for complete extraction workflow
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PendropValidator } from '../../src/utils/validator.js';
import { loadExtractionRules } from '../../src/utils/extractionRules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Extraction Workflow Integration', () => {
  let validator: PendropValidator;

  beforeAll(() => {
    validator = new PendropValidator();
  });

  describe('End-to-End Extraction', () => {
    it('should validate extracted fixture data', async () => {
      // Load the extracted fixture
      const fixturePath = join(__dirname, '../fixtures/penpot-extracted.json');
      const fixtureContent = await readFile(fixturePath, 'utf-8');
      const extractedData = JSON.parse(fixtureContent);

      // Validate against design system schema
      const result = await validator.validate(extractedData, 'ds');

      expect(result.valid).toBe(true);
      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
    });

    it('should have valid tokens in extracted data', async () => {
      const fixturePath = join(__dirname, '../fixtures/penpot-extracted.json');
      const fixtureContent = await readFile(fixturePath, 'utf-8');
      const extractedData = JSON.parse(fixtureContent);

      expect(extractedData.tokens).toBeDefined();
      expect(extractedData.tokens.color).toBeDefined();
      expect(extractedData.tokens.spacing).toBeDefined();
      expect(extractedData.tokens.typography).toBeDefined();

      // Check W3C DTCG format
      const primaryColor = extractedData.tokens.color.primary;
      expect(primaryColor).toHaveProperty('$value');
      expect(primaryColor).toHaveProperty('$type');
      expect(primaryColor.$type).toBe('color');
    });

    it('should have valid components in extracted data', async () => {
      const fixturePath = join(__dirname, '../fixtures/penpot-extracted.json');
      const fixtureContent = await readFile(fixturePath, 'utf-8');
      const extractedData = JSON.parse(fixtureContent);

      expect(extractedData.components).toBeDefined();
      expect(extractedData.components.button).toBeDefined();
      
      const button = extractedData.components.button;
      expect(button).toHaveProperty('name');
      expect(button).toHaveProperty('category');
      expect(button).toHaveProperty('props');
      expect(button.category).toBe('Atoms');
    });

    it('should have valid stories in extracted data', async () => {
      const fixturePath = join(__dirname, '../fixtures/penpot-extracted.json');
      const fixtureContent = await readFile(fixturePath, 'utf-8');
      const extractedData = JSON.parse(fixtureContent);

      expect(extractedData.stories).toBeDefined();
      expect(extractedData.stories.button).toBeDefined();
      
      const buttonStories = extractedData.stories.button;
      expect(buttonStories).toHaveProperty('componentId');
      expect(buttonStories).toHaveProperty('variants');
      expect(Array.isArray(buttonStories.variants)).toBe(true);
      expect(buttonStories.variants.length).toBeGreaterThan(0);
    });
  });

  describe('Extraction Rules Application', () => {
    it('should load extraction rules successfully', async () => {
      const rules = await loadExtractionRules('penpot', '/fake/path');

      expect(rules).toBeDefined();
      expect(rules.version).toBe('1.0');
      expect(rules.source).toBe('penpot');
    });

    it('should provide instructions for token extraction', async () => {
      const rules = await loadExtractionRules('penpot', '/fake/path');

      expect(rules.tokens_instructions).toBeDefined();
      expect(rules.tokens_instructions).toContain('color');
      expect(rules.tokens_instructions).toContain('spacing');
      expect(rules.tokens_instructions).toContain('typography');
    });

    it('should provide instructions for component extraction', async () => {
      const rules = await loadExtractionRules('penpot', '/fake/path');

      expect(rules.components_instructions).toBeDefined();
      expect(rules.components_instructions.toLowerCase()).toContain('component');
      expect(rules.components_instructions.toLowerCase()).toContain('props');
    });

    it('should specify naming conventions', async () => {
      const rules = await loadExtractionRules('penpot', '/fake/path');

      expect(rules.naming).toBeDefined();
      expect(rules.naming?.tokens).toBe('kebab-case');
      expect(rules.naming?.components).toBe('kebab-case');
      expect(rules.naming?.props).toBe('camelCase');
    });
  });

  describe('Data Flow Validation', () => {
    it('should demonstrate raw → extracted flow', async () => {
      // Load raw fixture
      const rawPath = join(__dirname, '../fixtures/penpot-raw.json');
      const rawContent = await readFile(rawPath, 'utf-8');
      const rawData = JSON.parse(rawContent);

      // Load extracted fixture
      const extractedPath = join(__dirname, '../fixtures/penpot-extracted.json');
      const extractedContent = await readFile(extractedPath, 'utf-8');
      const extractedData = JSON.parse(extractedContent);

      // Verify extraction captured key data
      expect(rawData.pages).toBeDefined();
      expect(extractedData.tokens).toBeDefined();
      expect(extractedData.components).toBeDefined();

      // Verify specific extractions
      // Raw has "primary-color" object -> Extracted has color.primary token
      const hasPrimaryColorRaw = rawData.pages.some((page: any) =>
        page.objects.some((obj: any) => obj.name === 'primary-color')
      );
      expect(hasPrimaryColorRaw).toBe(true);
      expect(extractedData.tokens.color.primary).toBeDefined();
    });

    it('should preserve component relationships', async () => {
      const extractedPath = join(__dirname, '../fixtures/penpot-extracted.json');
      const extractedContent = await readFile(extractedPath, 'utf-8');
      const extractedData = JSON.parse(extractedContent);

      // Button component should reference tokens
      const button = extractedData.components.button;
      expect(button.tokens).toBeDefined();
      expect(Array.isArray(button.tokens)).toBe(true);
      expect(button.tokens.length).toBeGreaterThan(0);

      // Verify referenced tokens exist
      for (const tokenRef of button.tokens) {
        const [category, name] = tokenRef.split('.');
        expect(extractedData.tokens[category]).toBeDefined();
        expect(extractedData.tokens[category][name]).toBeDefined();
      }
    });

    it('should link stories to components', async () => {
      const extractedPath = join(__dirname, '../fixtures/penpot-extracted.json');
      const extractedContent = await readFile(extractedPath, 'utf-8');
      const extractedData = JSON.parse(extractedContent);

      // Each story should reference a valid component
      for (const [storyId, story] of Object.entries(extractedData.stories)) {
        const componentId = (story as any).componentId;
        expect(componentId).toBeDefined();
        expect(extractedData.components[componentId]).toBeDefined();
      }
    });
  });

  describe('Schema Compliance', () => {
    it('should validate against pendrop.theme.json', async () => {
      const extractedPath = join(__dirname, '../fixtures/penpot-extracted.json');
      const extractedContent = await readFile(extractedPath, 'utf-8');
      const extractedData = JSON.parse(extractedContent);

      const result = await validator.validate(extractedData, 'ds');

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should have valid W3C DTCG token structure', async () => {
      const extractedPath = join(__dirname, '../fixtures/penpot-extracted.json');
      const extractedContent = await readFile(extractedPath, 'utf-8');
      const extractedData = JSON.parse(extractedContent);

      // Check all tokens have W3C DTCG structure
      for (const [category, tokens] of Object.entries(extractedData.tokens)) {
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

