import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { composePipeline } from '../src/composerEngine.js';
import { join } from 'path';
import { writeFile, mkdir, rm } from 'fs/promises';

// Mock getRepositoryRoot to point to fixtures
vi.mock('../src/utils/paths.js', () => ({
  getRepositoryRoot: () => join(process.cwd(), 'tests/fixtures')
}));

describe('Composer Engine', () => {
  const projectPath = join(process.cwd(), 'tests/fixtures/composer-test-project');

  beforeEach(async () => {
    await mkdir(projectPath, { recursive: true });
    
    // Create test pendrop.yml
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
      design_url: "http://example.com"
`;
    await writeFile(join(projectPath, 'pendrop.yml'), pendropYml);
  });

  afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true });
  });

  it('should run all steps if no step specified', async () => {
    const result = await composePipeline({
      pipeline: 'design-extract',
      project_path: projectPath
    });

    const instructions = result.instructions;
    expect(instructions).toContain('Global instructions.');
    expect(instructions).toContain('Step 1: Do step 1 task.');
    expect(instructions).toContain('Step 2: Do step 2 task.');
  });

  it('should run specific step and its dependencies', async () => {
    const result = await composePipeline({
      pipeline: 'design-extract',
      step: 'step1',
      project_path: projectPath
    });

    const instructions = result.instructions;
    expect(instructions).toContain('Global instructions.'); // header is dep of step1
    expect(instructions).toContain('Step 1: Do step 1 task.');
    expect(instructions).not.toContain('Step 2'); // step2 depends on step1, not vice versa
  });

  it('should throw error for invalid step', async () => {
    await expect(composePipeline({
      pipeline: 'design-extract',
      step: 'non-existent',
      project_path: projectPath
    })).rejects.toThrow('Step not found: non-existent');
  });

  it('should throw error if pipeline not configured', async () => {
    await expect(composePipeline({
      pipeline: 'unknown-pipeline',
      project_path: projectPath
    })).rejects.toThrow("Pipeline 'unknown-pipeline' not configured");
  });
});
