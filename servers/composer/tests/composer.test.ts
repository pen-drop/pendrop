import { describe, it, expect, vi } from 'vitest';
import { composePipeline } from '../src/composerEngine.js';
import { join } from 'path';

// Mock getRepositoryRoot to point to fixtures
vi.mock('../src/utils/paths.js', () => ({
  getRepositoryRoot: () => join(process.cwd(), 'tests/fixtures')
}));

describe('Composer Engine', () => {
  const projectPath = join(process.cwd(), 'tests/fixtures/project');

  it('should run all steps if no step specified', async () => {
    const result = await composePipeline({
      pipeline: 'design-extract', // Configured in fixtures/project/pendrop.yml
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
