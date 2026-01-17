import { type WorkflowDefinition } from './utils/workflowLoader.js';
import { templateEngine } from './utils/templateEngine.js';
import { loadPendropConfig } from './utils/pendropConfig.js';
import { join } from 'path';

export interface RunParams {
  workflow: string; // Workflow name
  task?: string | string[]; // Optional: Specific task(s) to run
  step?: string | string[]; // Optional: Filter by step(s)
  project_path: string;
  pendrop_file?: string; // Optional: Custom config filename (default: pendrop.yml)
  variables?: Record<string, any>; // Runtime overrides
}

export interface ComposeResult {
  instructions: string;
}

export interface ExecutionOperation {
  type: 'step' | 'task';
  id: string; // stepId or taskId
  contextStepId?: string; // For tasks, the step that provides context
}

/**
 * Resolve execution sequence (list of operations) based on filters
 */
export function resolveExecutionSequence(
  workflow: WorkflowDefinition,
  taskFilter?: string | string[],
  stepFilter?: string | string[]
): ExecutionOperation[] {
  const operations: ExecutionOperation[] = [];
  const executedDependencies = new Set<string>();
  const visitedSteps = new Set<string>();

  const resolveDependencies = (stepId: string) => {
    if (executedDependencies.has(stepId)) return;
    if (visitedSteps.has(stepId)) throw new Error(`Circular dependency detected in step: ${stepId}`);
    
    visitedSteps.add(stepId);
    
    const stepDef = workflow.steps?.[stepId];
    if (!stepDef) throw new Error(`Step not found: ${stepId}`);

    if (stepDef.dependencies) {
      const deps = Array.isArray(stepDef.dependencies) ? stepDef.dependencies : [stepDef.dependencies];
      for (const dep of deps) {
        resolveDependencies(dep);
      }
    }
    
    visitedSteps.delete(stepId);
    executedDependencies.add(stepId);
    operations.push({ type: 'step', id: stepId });
  };

  const expandTask = (taskId: string) => {
    const taskDef = workflow.tasks?.[taskId];
    if (!taskDef) {
       // Check if user accidentally passed a step name as task
       if (workflow.steps?.[taskId]) {
           throw new Error(`'${taskId}' is a Step, not a Task. Use 'step' argument to filter by steps.`);
       }
       throw new Error(`Task not found: ${taskId}`);
    }

    // Determine primary step
    const primaryStepId = taskDef.step;
    
    if (primaryStepId) {
       const stepDef = workflow.steps?.[primaryStepId];
       if (stepDef) {
           // Resolve dependencies (including the step itself)
           resolveDependencies(primaryStepId);
       }
       operations.push({ type: 'task', id: taskId, contextStepId: primaryStepId });
    } else {
        // Standalone task
        operations.push({ type: 'task', id: taskId });
    }
  };

  const taskList = taskFilter ? (Array.isArray(taskFilter) ? taskFilter : [taskFilter]) : [];
  const stepList = stepFilter ? (Array.isArray(stepFilter) ? stepFilter : [stepFilter]) : [];

  const tasksToRun = new Set<string>();

  // 1. Add explicitly requested tasks
  if (taskList.length > 0) {
    taskList.forEach(t => tasksToRun.add(t));
  }

  // 2. Add tasks from requested steps
  if (stepList.length > 0) {
      // Validate steps exist
      stepList.forEach(s => {
          if (!workflow.steps?.[s]) {
              throw new Error(`Step not found: ${s}`);
          }
      });

      // Find tasks belonging to these steps
      if (workflow.tasks) {
          Object.entries(workflow.tasks).forEach(([taskId, taskDef]) => {
              if (taskDef.step && stepList.includes(taskDef.step)) {
                  tasksToRun.add(taskId);
              }
          });
      }
  }

  // 3. If no filters, run all tasks
  if (taskList.length === 0 && stepList.length === 0) {
    if (workflow.tasks && Object.keys(workflow.tasks).length > 0) {
        Object.keys(workflow.tasks).forEach(t => tasksToRun.add(t));
    } else {
        throw new Error('No tasks defined in workflow. Cannot execute.');
    }
  }

  // Execute
  for (const t of tasksToRun) {
      expandTask(t);
  }
  
  return operations;
}

export async function runWorkflow(params: RunParams): Promise<ComposeResult> {
  const { workflow: workflowName, task, step, project_path, pendrop_file = 'pendrop.yml', variables = {} } = params;

  // 1. Load Project Config
  const projectConfig = await loadPendropConfig(project_path, pendrop_file);

  // 2. Resolve Workflow
  const workflow = projectConfig.workflows?.[workflowName];
  if (!workflow) {
      throw new Error(`Workflow '${workflowName}' not found in ${pendrop_file}`);
  }

  // 4. Merge Variables
  // Priority: Runtime > Workflow > Global Config
  const mergedVariables = {
    project_path,
    ...projectConfig.variables,
    ...workflow.variables,
    ...variables
  };

  // Expand variables (resolve {{var}} references)
  const finalVariables = await templateEngine.expandVariables(mergedVariables);

  // 5. Determine Execution Sequence
  const operations = resolveExecutionSequence(workflow, task, step);

  // 6. Generate Instructions
  let composedInstructions = '';
  const configPath = join(project_path, pendrop_file);

  for (const op of operations) {
    if (op.type === 'step') {
        const stepDef = workflow.steps?.[op.id];
        if (stepDef) {
             const template = stepDef.prompt;
             if (template) {
                 composedInstructions += `# ${stepDef.description || op.id}\n`;
                 const rendered = await templateEngine.render(template, finalVariables, configPath);
                 composedInstructions += rendered + '\n\n';
             }
        }
    } else if (op.type === 'task') {
        const taskDef = workflow.tasks?.[op.id];
        if (taskDef) {
            const template = taskDef.prompt;
            
            if (template) {
                // Use Task ID/Name as Header (## if context step exists, # otherwise)
                const headerPrefix = op.contextStepId ? '##' : '#';
                composedInstructions += `${headerPrefix} ${taskDef.description || op.id}\n`;
                const rendered = await templateEngine.render(template, finalVariables, configPath);
                composedInstructions += rendered + '\n\n';
            }
        }
    }
  }

  return {
    instructions: composedInstructions.trim()
  };
}
