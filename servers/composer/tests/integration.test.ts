import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { composePipeline } from '../src/composerEngine.js';
import { extractAsset, saveAsset } from '../src/utils/assetManager.js';
import { loadMergedConfig } from '../src/utils/configLoader.js';
import { join } from 'path';
import { writeFile, mkdir, readFile, rm } from 'fs/promises';

// Mock getRepositoryRoot to point to fixtures
vi.mock('../src/utils/paths.js', () => ({
  getRepositoryRoot: () => join(process.cwd(), 'tests/fixtures')
}));

describe('Integration Tests', () => {
  const projectPath = join(process.cwd(), 'tests/fixtures/integration-project');
  const testSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      component: {
        type: 'object',
        properties: {
          variants: { type: 'array' },
          props: { type: 'object' }
        }
      }
    }
  };

  beforeEach(async () => {
    await mkdir(projectPath, { recursive: true });
    
    // Create test pendrop.yml with assets
    const pendropYml = `assets:
  schema_url:
    path: "{{project_path}}/schema.json"
    writeable: false
    schema: null

pipelines:
  design-extract:
    tasks: test-recipe
    assets:
      design_data:
        path: "{{project_path}}/design-data.json"
        writeable: true
        schema: "{{project_path}}/schema.json"
    variables:
      step1_instructions: "Do step 1 task."
      step2_instructions: "Do step 2 task."
`;
    await writeFile(join(projectPath, 'pendrop.yml'), pendropYml);
    
    // Create test schema file
    await writeFile(join(projectPath, 'schema.json'), JSON.stringify(testSchema, null, 2));
    
    // Create initial design data
    await writeFile(
      join(projectPath, 'design-data.json'),
      JSON.stringify({ tokens: {}, components: {} }, null, 2)
    );
  });

  afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true });
  });

  describe('End-to-End Pipeline Composition', () => {
    it('should compose pipeline with assets and variables', async () => {
      const result = await composePipeline({
        pipeline: 'design-extract',
        project_path: projectPath
      });

      expect(result.instructions).toBeDefined();
      expect(result.instructions).toContain('Global instructions');
      expect(result.instructions).toContain('Step 1: Do step 1 task');
      expect(result.instructions).toContain('Step 2: Do step 2 task');
    });

    it('should merge variables from all sources', async () => {
      const result = await composePipeline({
        pipeline: 'design-extract',
        project_path: projectPath,
        variables: {
          runtime_var: 'runtime_value'
        }
      });

      // Should contain variables from all sources
      expect(result.instructions).toContain('Do step 1 task'); // from pendrop.yml
      expect(result.instructions).toContain('Global'); // from tasks.yml
    });
  });

  describe('Asset Management Integration', () => {
    it('should load merged config with assets from all sources', async () => {
      const config = await loadMergedConfig(
        projectPath,
        'design-extract',
        'test-recipe'
      );

      // Assets from all sources should be present
      expect(config.assets.schema_url).toBeDefined(); // from pendrop.yml root
      expect(config.assets.design_data).toBeDefined(); // from pendrop.yml pipeline
      expect(config.assets.design_data.writeable).toBe(true);
      expect(config.assets.pipeline_asset).toBeDefined(); // from pipeline.yaml
      expect(config.assets.task_asset).toBeDefined(); // from tasks.yml
    });

    it('should extract asset using JSONPath', async () => {
      const config = await loadMergedConfig(
        projectPath,
        'design-extract',
        'test-recipe'
      );

      const extracted = await extractAsset(
        'schema_url',
        '$.definitions.component',
        {},
        config.assets,
        projectPath,
        { ...config.variables, project_path: projectPath }
      );

      const parsed = JSON.parse(extracted);
      expect(parsed.type).toBe('object');
      expect(parsed.properties).toBeDefined();
    });

    it('should save asset with deep merge', async () => {
      const config = await loadMergedConfig(
        projectPath,
        'design-extract',
        'test-recipe'
      );

      // Save tokens
      const tokensResult = await saveAsset(
        'design_data',
        { tokens: { color: { primary: { $value: '#000' } } } },
        config.assets,
        projectPath,
        { ...config.variables, project_path: projectPath },
        { merge: true }
      );

      expect(tokensResult.success).toBe(true);

      // Save components (should merge with existing tokens)
      const componentsResult = await saveAsset(
        'design_data',
        { components: { button: { variants: [] } } },
        config.assets,
        projectPath,
        { ...config.variables, project_path: projectPath },
        { merge: true }
      );

      expect(componentsResult.success).toBe(true);

      // Verify both tokens and components exist
      const saved = JSON.parse(
        await readFile(join(projectPath, 'design-data.json'), 'utf-8')
      );
      expect(saved.tokens).toBeDefined();
      expect(saved.components).toBeDefined();
      expect(saved.components.button).toBeDefined();
    });

    it('should handle deep merge of nested structures', async () => {
      const config = await loadMergedConfig(
        projectPath,
        'design-extract',
        'test-recipe'
      );

      const vars = { ...config.variables, project_path: projectPath };
      
      // Initial save
      await saveAsset(
        'design_data',
        {
          components: {
            card: { name: 'Card', variants: [] }
          }
        },
        config.assets,
        projectPath,
        vars,
        { merge: true }
      );

      // Merge with additional component
      await saveAsset(
        'design_data',
        {
          components: {
            button: { name: 'Button', variants: [] }
          }
        },
        config.assets,
        projectPath,
        vars,
        { merge: true }
      );

      // Verify both components exist
      const saved = JSON.parse(
        await readFile(join(projectPath, 'design-data.json'), 'utf-8')
      );
      expect(saved.components.card).toBeDefined();
      expect(saved.components.button).toBeDefined();
    });

    it('should resolve variables in asset paths', async () => {
      const config = await loadMergedConfig(
        projectPath,
        'design-extract',
        'test-recipe'
      );

      // design_data path uses {{project_path}} - check asset exists
      const assetDef = config.assets.design_data;
      expect(assetDef).toBeDefined();
      expect(assetDef.path).toBeDefined();

      // Save should resolve the variable
      const result = await saveAsset(
        'design_data',
        { test: 'data' },
        config.assets,
        projectPath,
        { ...config.variables, project_path: projectPath },
        {}
      );

      expect(result.success).toBe(true);
      expect(result.path).toBeDefined();
    });
  });

  describe('Full Workflow Integration', () => {
    it('should complete full workflow: compose -> extract -> save', async () => {
      // 1. Compose pipeline
      const composeResult = await composePipeline({
        pipeline: 'design-extract',
        project_path: projectPath
      });
      expect(composeResult.instructions).toBeDefined();

      // 2. Load config
      const config = await loadMergedConfig(
        projectPath,
        'design-extract',
        'test-recipe'
      );

      // 3. Extract schema part
      const vars = { ...config.variables, project_path: projectPath };
      const schemaPart = await extractAsset(
        'schema_url',
        '$.definitions.component',
        { minify: false },
        config.assets,
        projectPath,
        vars
      );
      expect(schemaPart).toBeDefined();
      const parsed = JSON.parse(schemaPart);
      expect(parsed.type).toBe('object');

      // 4. Save design data
      const saveResult = await saveAsset(
        'design_data',
        {
          tokens: { color: { primary: { $value: '#000' } } },
          components: { button: { variants: [] } }
        },
        config.assets,
        projectPath,
        vars,
        { merge: true }
      );
      expect(saveResult.success).toBe(true);

      // 5. Verify saved data
      const saved = JSON.parse(
        await readFile(join(projectPath, 'design-data.json'), 'utf-8')
      );
      expect(saved.tokens.color.primary).toBeDefined();
      expect(saved.components.button).toBeDefined();
    });
  });
});

