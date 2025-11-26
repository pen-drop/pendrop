import { describe, it, expect, vi } from 'vitest';
import { loadPipeline } from '../src/utils/pipelineLoader.js';
import { loadTasks } from '../src/utils/tasksLoader.js';
import { join } from 'path';

// Mock getRepositoryRoot to point to fixtures
vi.mock('../src/utils/paths.js', () => ({
  getRepositoryRoot: () => join(process.cwd(), 'tests/fixtures')
}));

describe('Loaders', () => {
  const fixturesRoot = join(process.cwd(), 'tests/fixtures');

  describe('loadPipeline', () => {
    it('should load pipeline with steps (no templates)', async () => {
      const pipeline = await loadPipeline('test-pipeline', fixturesRoot);
      expect(pipeline.steps).toBeDefined();
      expect(pipeline.steps.step1).toBeDefined();
      // Template should not be in pipeline loader anymore
      expect((pipeline.steps.step1 as any).template).toBeUndefined();
      expect(pipeline.steps.step1.dependencies).toContain('header');
      expect(pipeline.schema).toBeDefined();
    });
  });

  describe('loadTasks', () => {
    it('should load tasks with templates', async () => {
      const tasks = await loadTasks('test-recipe', fixturesRoot);
      expect(tasks.pipeline).toBe('test-pipeline');
      expect(tasks.steps.step1).toBeDefined();
      expect(tasks.steps.step1.template).toBe('Step 1: {{step1_instructions}}');
    });
  });
});
