import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveAssetPath, deepMerge, loadAsset, extractAsset, saveAsset } from '../src/utils/assetManager.js';
import type { Assets, Variables } from '../src/types/config.js';
import { join } from 'path';
import { writeFile, mkdir, readFile, rm } from 'fs/promises';

describe('Asset Manager', () => {
  const tempDir = join(process.cwd(), 'tests/fixtures/temp-assets');

  beforeEach(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('resolveAssetPath', () => {
    it('should resolve variables in path', () => {
      const assetDef = {
        path: '{{project_path}}/data.json',
        writeable: false
      };
      const variables: Variables = {
        project_path: '/home/user/project'
      };

      const resolved = resolveAssetPath(assetDef, variables);
      expect(resolved).toBe('/home/user/project/data.json');
    });

    it('should resolve variables in URL', () => {
      const assetDef = {
        url: 'https://example.com/{{version}}/data.json',
        writeable: false
      };
      const variables: Variables = {
        version: 'v1'
      };

      const resolved = resolveAssetPath(assetDef, variables);
      expect(resolved).toBe('https://example.com/v1/data.json');
    });

    it('should handle multiple variables', () => {
      const assetDef = {
        path: '{{project_path}}/{{type}}/data.json',
        writeable: false
      };
      const variables: Variables = {
        project_path: '/home/user',
        type: 'test'
      };

      const resolved = resolveAssetPath(assetDef, variables);
      expect(resolved).toBe('/home/user/test/data.json');
    });
  });

  describe('deepMerge', () => {
    it('should merge nested objects', () => {
      const target = {
        components: {
          card: { name: 'Card' }
        },
        tokens: {
          color: { primary: '#000' }
        }
      };
      const source = {
        components: {
          button: { name: 'Button' }
        },
        tokens: {
          spacing: { md: '16px' }
        }
      };

      const merged = deepMerge(target, source);
      expect(merged.components.card).toBeDefined();
      expect(merged.components.button).toBeDefined();
      expect(merged.tokens.color).toBeDefined();
      expect(merged.tokens.spacing).toBeDefined();
    });

    it('should replace arrays entirely', () => {
      const target = {
        items: [1, 2, 3]
      };
      const source = {
        items: [4, 5]
      };

      const merged = deepMerge(target, source);
      expect(merged.items).toEqual([4, 5]);
    });

    it('should replace primitives', () => {
      const target = {
        name: 'Old',
        count: 10
      };
      const source = {
        name: 'New',
        count: 20
      };

      const merged = deepMerge(target, source);
      expect(merged.name).toBe('New');
      expect(merged.count).toBe(20);
    });
  });

  describe('loadAsset', () => {
    it('should load asset from local file', async () => {
      const testData = { test: 'data' };
      const testFile = join(tempDir, 'test.json');
      await writeFile(testFile, JSON.stringify(testData));

      const assets: Assets = {
        test_asset: {
          path: 'test.json',
          writeable: false
        }
      };
      const variables: Variables = {};

      const loaded = await loadAsset('test_asset', assets, tempDir, variables);
      expect(loaded).toEqual(testData);
    });

    it('should resolve variables in path', async () => {
      const testData = { test: 'data' };
      const subDir = join(tempDir, 'subdir');
      await mkdir(subDir, { recursive: true });
      const testFile = join(subDir, 'test.json');
      await writeFile(testFile, JSON.stringify(testData));

      const assets: Assets = {
        test_asset: {
          path: '{{subdir}}/test.json',
          writeable: false
        }
      };
      const variables: Variables = {
        subdir: 'subdir'
      };

      const loaded = await loadAsset('test_asset', assets, tempDir, variables);
      expect(loaded).toEqual(testData);
    });

    it('should throw error for missing asset', async () => {
      const assets: Assets = {};
      const variables: Variables = {};

      await expect(
        loadAsset('missing', assets, tempDir, variables)
      ).rejects.toThrow("Asset 'missing' not found");
    });
  });

  describe('extractAsset', () => {
    it('should extract using JSONPath', async () => {
      const testData = {
        components: {
          button: { name: 'Button' },
          card: { name: 'Card' }
        }
      };
      const testFile = join(tempDir, 'test.json');
      await writeFile(testFile, JSON.stringify(testData));

      const assets: Assets = {
        test_asset: {
          path: 'test.json',
          writeable: false
        }
      };
      const variables: Variables = {};

      const extracted = await extractAsset(
        'test_asset',
        '$.components.button',
        {},
        assets,
        tempDir,
        variables
      );

      const parsed = JSON.parse(extracted);
      expect(parsed.name).toBe('Button');
    });

    it('should minify output when requested', async () => {
      const testData = { test: 'data' };
      const testFile = join(tempDir, 'test.json');
      await writeFile(testFile, JSON.stringify(testData));

      const assets: Assets = {
        test_asset: {
          path: 'test.json',
          writeable: false
        }
      };
      const variables: Variables = {};

      const extracted = await extractAsset(
        'test_asset',
        '$',
        { minify: true },
        assets,
        tempDir,
        variables
      );

      expect(extracted).not.toContain('\n');
      expect(extracted).not.toContain(' ');
    });
  });

  describe('saveAsset', () => {
    it('should save new asset', async () => {
      const assets: Assets = {
        test_asset: {
          path: 'output.json',
          writeable: true
        }
      };
      const variables: Variables = {};
      const data = { test: 'data' };

      const result = await saveAsset(
        'test_asset',
        data,
        assets,
        tempDir,
        variables,
        {}
      );

      expect(result.success).toBe(true);
      expect(result.path).toBeDefined();

      const saved = JSON.parse(await readFile(result.path!, 'utf-8'));
      expect(saved).toEqual(data);
    });

    it('should merge with existing data', async () => {
      const existingData = {
        components: {
          card: { name: 'Card' }
        }
      };
      const testFile = join(tempDir, 'output.json');
      await writeFile(testFile, JSON.stringify(existingData));

      const assets: Assets = {
        test_asset: {
          path: 'output.json',
          writeable: true
        }
      };
      const variables: Variables = {};
      const newData = {
        components: {
          button: { name: 'Button' }
        }
      };

      const result = await saveAsset(
        'test_asset',
        newData,
        assets,
        tempDir,
        variables,
        { merge: true }
      );

      expect(result.success).toBe(true);

      const saved = JSON.parse(await readFile(testFile, 'utf-8'));
      expect(saved.components.card).toBeDefined();
      expect(saved.components.button).toBeDefined();
    });

    it('should not save non-writeable asset', async () => {
      const assets: Assets = {
        test_asset: {
          path: 'output.json',
          writeable: false
        }
      };
      const variables: Variables = {};
      const data = { test: 'data' };

      const result = await saveAsset(
        'test_asset',
        data,
        assets,
        tempDir,
        variables,
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not writeable');
    });

    it('should support dryrun mode', async () => {
      const assets: Assets = {
        test_asset: {
          path: 'output.json',
          writeable: true
        }
      };
      const variables: Variables = {};
      const data = { test: 'data' };

      const result = await saveAsset(
        'test_asset',
        data,
        assets,
        tempDir,
        variables,
        { dryrun: true }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('dryrun');

      // File should not exist
      await expect(
        readFile(join(tempDir, 'output.json'), 'utf-8')
      ).rejects.toThrow();
    });
  });
});

