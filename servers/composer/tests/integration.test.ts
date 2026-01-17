import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runWorkflow } from '../src/composerEngine.js';
import { extractAsset, saveAsset } from '../src/utils/assetManager.js';
import { loadMergedConfig } from '../src/utils/configLoader.js';
import { join } from 'path';
import { writeFile, mkdir, readFile, rm } from 'fs/promises';

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
    
    // Create steps file
    const stepsYaml = `
step1:
  prompt: "Step 1: {{step1_instructions}}"
step2:
  prompt: "Step 2: {{step2_instructions}}"
  dependencies: ["step1"]
`;
    await writeFile(join(projectPath, 'steps.yaml'), stepsYaml);

    // Create workflow file
    const workflowYaml = `
variables:
  step1_instructions: "Do step 1 task."
  step2_instructions: "Do step 2 task."
assets:
  task_asset:
    url: "https://example.com/task.json"
    writeable: false
steps: !include ./steps.yaml
tasks:
  main:
    step: "step2"
`;
    await writeFile(join(projectPath, 'workflow.yaml'), workflowYaml);

    // Create test pendrop.yml
    const pendropYml = `
assets:
  schema_url:
    path: "{{project_path}}/schema.json"
    writeable: false
    schema: null
  design_data:
    path: "{{project_path}}/design-data.json"
    writeable: true
    schema: "{{project_path}}/schema.json"
  pipeline_asset:
    url: "https://example.com/pipeline.json"
    writeable: false
variables:
  runtime_var: "runtime_default"

workflows:
  design-extract: !include ./workflow.yaml
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

  describe('End-to-End Workflow Composition', () => {
    it('should compose workflow with assets, variables and !include', async () => {
      const result = await runWorkflow({
        workflow: 'design-extract',
        project_path: projectPath
      });

      expect(result.instructions).toBeDefined();
      expect(result.instructions).toContain('Step 1: Do step 1 task');
      expect(result.instructions).toContain('Step 2: Do step 2 task');
    });

    it('should merge variables from all sources', async () => {
      const result = await runWorkflow({
        workflow: 'design-extract',
        project_path: projectPath,
        variables: {
          step1_instructions: 'Override Step 1'
        }
      });

      expect(result.instructions).toContain('Override Step 1');
    });
  });

  describe('Asset Management Integration', () => {
    it('should load merged config', async () => {
      const config = await loadMergedConfig(
        projectPath,
        'design-extract'
      );

      expect(config.assets.schema_url).toBeDefined();
      expect(config.assets.design_data).toBeDefined();
      expect(config.assets.task_asset).toBeDefined();
    });

    it('should extract asset using JSONPath', async () => {
      const config = await loadMergedConfig(
        projectPath,
        'design-extract'
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
        'design-extract'
      );

      const tokensResult = await saveAsset(
        'design_data',
        { tokens: { color: { primary: { $value: '#000' } } } },
        config.assets,
        projectPath,
        { ...config.variables, project_path: projectPath },
        { merge: true }
      );

      expect(tokensResult.success).toBe(true);
    });
  });
});
