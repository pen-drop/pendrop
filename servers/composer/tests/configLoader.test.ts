import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadMergedConfig } from '../src/utils/configLoader.js';
import { join } from 'path';
import { writeFile, mkdir, rm } from 'fs/promises';

// Mock getRepositoryRoot to point to fixtures
vi.mock('../src/utils/paths.js', () => ({
  getRepositoryRoot: () => join(process.cwd(), 'tests/fixtures')
}));

describe('Config Loader', () => {
  const tempProjectPath = join(process.cwd(), 'tests/fixtures/temp-project');

  beforeEach(async () => {
    // Create temp project directory
    await mkdir(tempProjectPath, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp project directory
    await rm(tempProjectPath, { recursive: true, force: true });
  });

  it('should load and merge assets from all sources', async () => {
    // Create test pendrop.yml with assets
    const pendropYml = `pipelines:
  design-extract:
    tasks: test-recipe
    assets:
      root_asset:
        url: "https://example.com/root.json"
        writeable: false
    variables:
      test_var: "root_value"
assets:
  global_asset:
    url: "https://example.com/global.json"
    writeable: false
variables:
  global_var: "global_value"
`;
    await writeFile(join(tempProjectPath, 'pendrop.yml'), pendropYml);

    const config = await loadMergedConfig(
      tempProjectPath,
      'design-extract',
      'test-recipe'
    );

    // Global assets should be present
    expect(config.assets.global_asset).toBeDefined();
    // Pipeline assets should be present
    expect(config.assets.root_asset).toBeDefined();
    // Variables should be merged
    expect(config.variables.global_var).toBe('global_value');
    expect(config.variables.test_var).toBe('root_value');
  });

  it('should respect merge priority (root > pipeline > pipeline.yaml > tasks.yml)', async () => {
    const pendropYml = `pipelines:
  design-extract:
    tasks: test-recipe
    assets:
      test_asset:
        url: "https://pipeline.com/asset.json"
        writeable: true
    variables:
      test_var: "pipeline_value"
assets:
  test_asset:
    url: "https://root.com/asset.json"
    writeable: false
variables:
  test_var: "root_value"
`;
    await writeFile(join(tempProjectPath, 'pendrop.yml'), pendropYml);

    const config = await loadMergedConfig(
      tempProjectPath,
      'design-extract',
      'test-recipe'
    );

    // Root should override pipeline
    expect(config.assets.test_asset.url).toBe('https://root.com/asset.json');
    expect(config.variables.test_var).toBe('root_value');
  });

  it('should handle missing assets/variables gracefully', async () => {
    const pendropYml = `pipelines:
  design-extract:
    tasks: test-recipe
`;
    await writeFile(join(tempProjectPath, 'pendrop.yml'), pendropYml);

    const config = await loadMergedConfig(
      tempProjectPath,
      'design-extract',
      'test-recipe'
    );

    // Assets may come from pipeline.yaml and tasks.yml even if not in pendrop.yml
    expect(typeof config.assets).toBe('object');
    // Variables may come from tasks.yml or pipeline.yaml, so we just check it's an object
    expect(typeof config.variables).toBe('object');
  });

  it('should have both global and pipeline-specific assets and variables', async () => {
    const pendropYml = `assets:
  global_asset_1:
    url: "https://example.com/global1.json"
    writeable: false
  global_asset_2:
    url: "https://example.com/global2.json"
    writeable: false

variables:
  global_var_1: "global_value_1"
  global_var_2: "global_value_2"

pipelines:
  design-extract:
    tasks: test-recipe
    assets:
      pipeline_asset_1:
        url: "https://example.com/pipeline1.json"
        writeable: true
      pipeline_asset_2:
        url: "https://example.com/pipeline2.json"
        writeable: true
    variables:
      pipeline_var_1: "pipeline_value_1"
      pipeline_var_2: "pipeline_value_2"
`;
    await writeFile(join(tempProjectPath, 'pendrop.yml'), pendropYml);

    const config = await loadMergedConfig(
      tempProjectPath,
      'design-extract',
      'test-recipe'
    );

    // Both global assets should be present
    expect(config.assets.global_asset_1).toBeDefined();
    expect(config.assets.global_asset_2).toBeDefined();
    expect(config.assets.global_asset_1.url).toBe('https://example.com/global1.json');
    expect(config.assets.global_asset_2.url).toBe('https://example.com/global2.json');

    // Both pipeline assets should be present
    expect(config.assets.pipeline_asset_1).toBeDefined();
    expect(config.assets.pipeline_asset_2).toBeDefined();
    expect(config.assets.pipeline_asset_1.url).toBe('https://example.com/pipeline1.json');
    expect(config.assets.pipeline_asset_2.url).toBe('https://example.com/pipeline2.json');
    expect(config.assets.pipeline_asset_1.writeable).toBe(true);
    expect(config.assets.pipeline_asset_2.writeable).toBe(true);

    // Both global variables should be present
    expect(config.variables.global_var_1).toBe('global_value_1');
    expect(config.variables.global_var_2).toBe('global_value_2');

    // Both pipeline variables should be present
    expect(config.variables.pipeline_var_1).toBe('pipeline_value_1');
    expect(config.variables.pipeline_var_2).toBe('pipeline_value_2');

    // All assets should be merged together (4 total)
    expect(Object.keys(config.assets).length).toBeGreaterThanOrEqual(4);
    // All variables should be merged together (4 total, plus any from pipeline.yaml and tasks.yml)
    expect(Object.keys(config.variables).length).toBeGreaterThanOrEqual(4);
  });

  it('should allow global variables to override pipeline variables with same name (root > pipeline)', async () => {
    const pendropYml = `variables:
  shared_var: "global_value"
  global_only: "global_only_value"

pipelines:
  design-extract:
    tasks: test-recipe
    variables:
      shared_var: "pipeline_value"
      pipeline_only: "pipeline_only_value"
`;
    await writeFile(join(tempProjectPath, 'pendrop.yml'), pendropYml);

    const config = await loadMergedConfig(
      tempProjectPath,
      'design-extract',
      'test-recipe'
    );

    // Global variable should override pipeline variable (root > pipeline priority)
    expect(config.variables.shared_var).toBe('global_value');
    // Global-only variable should still be present
    expect(config.variables.global_only).toBe('global_only_value');
    // Pipeline-only variable should be present
    expect(config.variables.pipeline_only).toBe('pipeline_only_value');
  });
});

