import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runWorkflow } from '../src/composerEngine.js';
import { join } from 'path';
import { writeFile, mkdir, rm } from 'fs/promises';

describe('Composer Engine', () => {
  const projectPath = join(process.cwd(), 'tests/fixtures/composer-test-project');

  beforeEach(async () => {
    await mkdir(projectPath, { recursive: true });
    
    // Create workflow file
    const workflowYaml = `
variables:
  global_instructions: "Global instructions."
steps:
  header:
    prompt: "{{global_instructions}}"
  step1:
    prompt: "Step 1: {{step1_instructions}}"
    dependencies: ["header"]
  step2:
    prompt: "Step 2: {{step2_instructions}}"
    dependencies: ["step1"]
tasks:
  main:
    step: "step2"
    prompt: "Main Task"
`;
    await writeFile(join(projectPath, 'workflow.yaml'), workflowYaml);

    // Create test pendrop.yml
    const pendropYml = `
assets:
  schema_url:
    path: "{{project_path}}/schema.json"
    writeable: false
    schema: null

workflows:
  design-extract: !include ./workflow.yaml
`;
    await writeFile(join(projectPath, 'pendrop.yml'), pendropYml);
  });

  afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true });
  });

  const runVariables = {
      step1_instructions: "Do step 1 task.",
      step2_instructions: "Do step 2 task."
  };

  it('should run all tasks if no task/step specified', async () => {
    const result = await runWorkflow({
      workflow: 'design-extract',
      project_path: projectPath,
      variables: runVariables
    });

    const instructions = result.instructions;
    expect(instructions).toContain('Global instructions.');
    expect(instructions).toContain('Step 1: Do step 1 task.');
    expect(instructions).toContain('Step 2: Do step 2 task.');
  });

  it('should run specific task', async () => {
    const result = await runWorkflow({
      workflow: 'design-extract',
      task: 'main',
      project_path: projectPath,
      variables: runVariables
    });

    const instructions = result.instructions;
    expect(instructions).toContain('Global instructions.'); 
    expect(instructions).toContain('Step 1: Do step 1 task.');
    expect(instructions).toContain('Step 2: Do step 2 task.');
  });

  it('should throw error if targeting a step via task argument', async () => {
    await expect(runWorkflow({
      workflow: 'design-extract',
      task: 'step1',
      project_path: projectPath
    })).rejects.toThrow(/'step1' is a Step, not a Task. Use 'step' argument to filter by steps./);
  });

  it('should throw error for invalid task', async () => {
    await expect(runWorkflow({
      workflow: 'design-extract',
      task: 'non-existent',
      project_path: projectPath
    })).rejects.toThrow('Task not found: non-existent');
  });

  it('should throw error if workflow not configured', async () => {
    await expect(runWorkflow({
      workflow: 'unknown-pipeline',
      project_path: projectPath
    })).rejects.toThrow("Workflow 'unknown-pipeline' not found");
  });
});
