import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadMergedConfig } from '../src/utils/configLoader.js';
import { join } from 'path';
import { writeFile, mkdir, rm } from 'fs/promises';

describe('Config Loader', () => {
  const tempProjectPath = join(process.cwd(), 'tests/fixtures/temp-project');

  beforeEach(async () => {
    await mkdir(tempProjectPath, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempProjectPath, { recursive: true, force: true });
  });

  it('should load and merge assets from all sources', async () => {
    const pendropYml = `
assets:
  global_asset:
    url: "https://example.com/global.json"
    writeable: false
variables:
  global_var: "global_value"
  test_var: "global_value"

workflows:
  design-extract:
    assets:
      workflow_asset:
        url: "https://workflow.com"
        writeable: false
    variables:
      workflow_var: "workflow_value"
      test_var: "workflow_override"
`;
    await writeFile(join(tempProjectPath, 'pendrop.yml'), pendropYml);

    const config = await loadMergedConfig(
      tempProjectPath,
      'design-extract'
    );

    expect(config.assets.global_asset).toBeDefined();
    expect(config.assets.workflow_asset).toBeDefined();
    expect(config.variables.global_var).toBe('global_value');
    expect(config.variables.workflow_var).toBe('workflow_value');
    expect(config.variables.test_var).toBe('workflow_override');
  });

  it('should throw if workflow not found', async () => {
    const pendropYml = `
workflows: {}`;
    await writeFile(join(tempProjectPath, 'pendrop.yml'), pendropYml);

    await expect(loadMergedConfig(
      tempProjectPath,
      'missing-flow'
    )).rejects.toThrow(/Workflow 'missing-flow' not found/);
  });
});
