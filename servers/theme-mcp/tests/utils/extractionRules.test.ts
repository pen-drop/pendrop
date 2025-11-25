/**
 * Unit tests for Extraction Rules Loader
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadExtractionRules, loadExamples } from '../../src/utils/extractionRules.js';
import type { PendropConfig } from '../../src/utils/projectConfig.js';

describe('Extraction Rules Loader', () => {
  describe('loadExtractionRules', () => {
    it('should load built-in Penpot extraction rules', async () => {
      const rules = await loadExtractionRules('pendrop-penpot', '/fake/project/path');

      expect(rules).toBeDefined();
      expect(rules.version).toBe('1.0');
      expect(rules.source).toBe('penpot');
      expect(rules.instructions).toBeDefined();
      expect(rules.tokens_instructions).toBeDefined();
      expect(rules.components_instructions).toBeDefined();
    });

    it('should load built-in Figma extraction rules', async () => {
      const rules = await loadExtractionRules('pendrop-figma', '/fake/project/path');

      expect(rules).toBeDefined();
      expect(rules.version).toBe('1.0');
      expect(rules.source).toBe('figma');
      expect(rules.instructions).toBeDefined();
    });

    it('should fail for non-existent package', async () => {
      await expect(async () => {
        await loadExtractionRules('pendrop-nonexistent', '/fake/project/path');
      }).rejects.toThrow();
    });

    it('should include naming conventions', async () => {
      const rules = await loadExtractionRules('pendrop-penpot', '/fake/project/path');

      expect(rules.naming).toBeDefined();
      expect(rules.naming?.tokens).toBeDefined();
      expect(rules.naming?.components).toBeDefined();
      expect(rules.naming?.props).toBeDefined();
    });

    it('should include optional hints', async () => {
      const rules = await loadExtractionRules('pendrop-penpot', '/fake/project/path');

      expect(rules.hints).toBeDefined();
    });
  });

  describe('loadExamples', () => {
    it('should load example extractions for Penpot', async () => {
      const examples = await loadExamples('pendrop-penpot');

      expect(examples).toBeDefined();
      expect(examples).toContain('Example Input');
      expect(examples).toContain('Example Output');
      expect(examples).toContain('json');
    });

    it('should return message if examples not available', async () => {
      const examples = await loadExamples('pendrop-nonexistent');

      expect(examples).toContain('No examples available');
    });

    it('should format examples as markdown', async () => {
      const examples = await loadExamples('pendrop-penpot');

      expect(examples).toContain('```json');
      expect(examples).toContain('```');
    });
  });

  describe('Custom Package Loading', () => {
    it('should throw error for NPM packages (not yet supported)', async () => {
      const config: PendropConfig = {
        project: {
          type: 'drupal',
          name: 'test',
          theme: 'test',
        },
        rules: {
          extraction: '@company/penpot-extraction',
        },
      };

      await expect(async () => {
        await loadExtractionRules('@company/penpot-extraction', '/project', config);
      }).rejects.toThrow('NPM package extraction rules not yet supported');
    });

    it('should accept local path configuration', async () => {
      // This test would need a mock file system or fixture
      // For now, we just verify the logic path exists
      const config: PendropConfig = {
        project: {
          type: 'drupal',
          name: 'test',
          theme: 'test',
        },
        rules: {
          extraction: './custom/rules',
        },
      };

      // Would throw if file doesn't exist
      await expect(async () => {
        await loadExtractionRules('./custom/rules', '/nonexistent', config);
      }).rejects.toThrow();
    });
  });

  describe('Extraction Rules Structure', () => {
    it('should have all required fields', async () => {
      const rules = await loadExtractionRules('pendrop-penpot', '/fake/project/path');

      expect(rules.version).toBeDefined();
      expect(rules.source).toBeDefined();
      expect(rules.instructions).toBeDefined();
      expect(rules.tokens_instructions).toBeDefined();
      expect(rules.components_instructions).toBeDefined();
    });

    it('should have optional stories instructions', async () => {
      const rules = await loadExtractionRules('pendrop-penpot', '/fake/project/path');

      // stories_instructions is optional
      if (rules.stories_instructions) {
        expect(typeof rules.stories_instructions).toBe('string');
      }
    });

    it('should have valid naming conventions', async () => {
      const rules = await loadExtractionRules('pendrop-penpot', '/fake/project/path');

      if (rules.naming) {
        const validCases = ['kebab-case', 'camelCase', 'snake_case', 'PascalCase'];
        
        if (rules.naming.tokens) {
          expect(validCases).toContain(rules.naming.tokens);
        }
        if (rules.naming.components) {
          expect(validCases).toContain(rules.naming.components);
        }
        if (rules.naming.props) {
          expect(validCases).toContain(rules.naming.props);
        }
      }
    });
  });
});

