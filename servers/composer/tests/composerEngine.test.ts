import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runWorkflow } from '../src/composerEngine.js';
import { templateEngine } from '../src/utils/templateEngine.js';
import { loadPendropConfig } from '../src/utils/pendropConfig.js';
import { join } from 'path';

// Mock dependencies
vi.mock('../src/utils/templateEngine.js');
vi.mock('../src/utils/pendropConfig.js');

describe('ComposerEngine', () => {
  const projectPath = '/test/project';
  const workflow = {
    variables: { global: 'var' },
    steps: {
      step1: { description: 'Step 1 Desc', prompt: 'Step 1 Prompt' },
      step2: { description: 'Step 2 Desc', prompt: 'Step 2 Prompt', dependencies: ['step1'] },
      step3: { description: 'Step 3 Desc', prompt: 'Step 3 Prompt' }
    },
    tasks: {
      task1: { description: 'Task 1 Desc', prompt: 'Task 1 Prompt', step: 'step2' }, // step2 depends on step1
      task2: { description: 'Task 2 Desc', prompt: 'Task 2 Prompt', step: 'step3' }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (loadPendropConfig as any).mockResolvedValue({
      workflows: {
        'test-workflow': workflow
      }
    });
    (templateEngine.render as any).mockImplementation((tpl) => Promise.resolve(`Rendered: ${tpl}`));
    (templateEngine.expandVariables as any).mockImplementation((vars) => Promise.resolve(vars));
  });

  it('should run all tasks by default', async () => {
    const result = await runWorkflow({
      workflow: 'test-workflow',
      project_path: projectPath
    });

    // Check Step 1
    expect(result.instructions).toContain('# Step 1 Desc');
    expect(result.instructions).toContain('Rendered: Step 1 Prompt');
    
    // Check Step 2 (Context for Task 1)
    expect(result.instructions).toContain('# Step 2 Desc');
    expect(result.instructions).toContain('Rendered: Step 2 Prompt');
    
    // Check Task 1
    expect(result.instructions).toContain('## Task 1 Desc');
    expect(result.instructions).toContain('Rendered: Task 1 Prompt');
    
    // Check Step 3 (Context for Task 2)
    expect(result.instructions).toContain('# Step 3 Desc');
    expect(result.instructions).toContain('Rendered: Step 3 Prompt');

    // Check Task 2
    expect(result.instructions).toContain('## Task 2 Desc');
    expect(result.instructions).toContain('Rendered: Task 2 Prompt');
  });

  it('should run specific task', async () => {
    const result = await runWorkflow({
      workflow: 'test-workflow',
      task: 'task2',
      project_path: projectPath
    });

    expect(result.instructions).not.toContain('Rendered: Step 1 Prompt');
    expect(result.instructions).toContain('# Step 3 Desc');
    expect(result.instructions).toContain('## Task 2 Desc');
  });

  it('should run tasks by step filter', async () => {
    const result = await runWorkflow({
        workflow: 'test-workflow',
        step: 'step3',
        project_path: projectPath
    });
    
    // Step 3 tasks (Task 2)
    expect(result.instructions).toContain('## Task 2 Desc');
    // Step 2 tasks (Task 1) NOT present
    expect(result.instructions).not.toContain('## Task 1 Desc');
  });

  it('should throw if task argument is actually a step', async () => {
    await expect(runWorkflow({
      workflow: 'test-workflow',
      task: 'step1',
      project_path: projectPath
    })).rejects.toThrow(/'step1' is a Step, not a Task. Use 'step' argument to filter by steps./);
  });

  it('should resolve step dependencies via task', async () => {
    const result = await runWorkflow({
      workflow: 'test-workflow',
      task: 'task1',
      project_path: projectPath
    });

    // Instructions should contain Step 1 then Step 2 then Task 1
    expect(result.instructions).toMatch(/Step 1 Desc.*Step 2 Desc.*Task 1 Desc/s);
  });
  
  it('should handle standalone tasks (no step)', async () => {
      const workflowWithTask3 = {
          ...workflow,
          tasks: {
              ...workflow.tasks,
              task3: { description: 'Task 3', prompt: 'Task Only' }
          }
      };
      (loadPendropConfig as any).mockResolvedValue({
        workflows: {
            'test-workflow': workflowWithTask3
        }
      });
      
      const result = await runWorkflow({
          workflow: 'test-workflow',
          task: 'task3',
          project_path: projectPath
      });
      
      // Should NOT have Step header
      expect(result.instructions).not.toContain('# Step');
      // Should have Task header (# since standalone)
      expect(result.instructions).toContain('# Task 3');
      expect(result.instructions).toContain('Rendered: Task Only');
  });

  it('should use custom pendrop file if provided', async () => {
      await runWorkflow({
          workflow: 'test-workflow',
          project_path: projectPath,
          pendrop_file: 'custom-config.yml'
      });
      
      expect(loadPendropConfig).toHaveBeenCalledWith(projectPath, 'custom-config.yml');
      
      // Also check if template engine receives the correct context path
      expect(templateEngine.render).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          join(projectPath, 'custom-config.yml') // Expect custom config path
      );
  });
});
