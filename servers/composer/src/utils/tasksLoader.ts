import { readFile } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';

export interface Tasks {
  pipeline: string;
  variables: Record<string, unknown>;
  steps: Record<string, {
    template: string;
  }>;
}

/**
 * Load tasks from the composer/tasks directory
 * @param tasksName - Name of the tasks directory
 * @param composerRoot - Root path where composer directory resides
 */
export async function loadTasks(tasksName: string, composerRoot: string): Promise<Tasks> {
  const tasksDir = join(composerRoot, 'composer/tasks', tasksName);
  const tasksPath = join(tasksDir, 'tasks.yml');

  let tasksContent: string;
  try {
    tasksContent = await readFile(tasksPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load tasks from ${tasksPath}: ${error}`);
  }

  const rawTasks = yaml.load(tasksContent) as any;

  // Validate structure
  if (!rawTasks.pipeline) {
      throw new Error(`Tasks ${tasksName} missing required 'pipeline' field`);
  }

  return {
    pipeline: rawTasks.pipeline,
    variables: rawTasks.variables || {},
    steps: rawTasks.steps || {}
  };
}

