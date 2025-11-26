import { loadPipeline } from './utils/pipelineLoader.js';
import { loadTasks } from './utils/tasksLoader.js';
import { loadPendropConfig } from './utils/projectConfig.js';
import { loadMergedConfig } from './utils/configLoader.js';
import { getRepositoryRoot } from './utils/paths.js';

export interface ComposeParams {
  pipeline: string; // Pipeline name (key in pendrop.yml pipelines)
  step?: string | string[]; // Optional step(s) to run
  project_path: string;
  variables?: Record<string, any>; // Runtime overrides
}

export interface ComposeResult {
  instructions: string;
}

/**
 * Replace template variables in a string
 */
function replaceTemplateVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  if (!result) return '';
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    // Replace all occurrences
    result = result.split(placeholder).join(replacement);
  }
  return result;
}

/**
 * Resolve steps and their dependencies
 */
function resolveSteps(
  availableSteps: Record<string, { dependencies?: string[] }>,
  requestedSteps?: string | string[]
): string[] {
  const resolved = new Set<string>();
  const visiting = new Set<string>();

  function visit(stepId: string) {
    if (resolved.has(stepId)) return;
    if (visiting.has(stepId)) throw new Error(`Circular dependency detected: ${stepId}`);
    
    if (!availableSteps[stepId]) throw new Error(`Step not found: ${stepId}`);

    visiting.add(stepId);
    
    // Visit dependencies first
    const deps = availableSteps[stepId].dependencies || [];
    for (const dep of deps) {
      visit(dep);
    }

    visiting.delete(stepId);
    resolved.add(stepId);
  }

  // If specific steps requested, resolve them
  if (requestedSteps) {
    const stepsToResolve = Array.isArray(requestedSteps) ? requestedSteps : [requestedSteps];
    for (const step of stepsToResolve) {
      visit(step);
    }
  } else {
    // If no steps requested, resolve all (in dependency order)
    for (const stepId of Object.keys(availableSteps)) {
      visit(stepId);
    }
  }

  return Array.from(resolved);
}


export async function composePipeline(params: ComposeParams): Promise<ComposeResult> {
  const { pipeline, step, project_path, variables = {} } = params;
  const repoRoot = getRepositoryRoot();

  // 1. Load Project Config
  const projectConfig = await loadPendropConfig(project_path);

  // 2. Resolve Tasks Package from Config
  // Look for pipelines configuration in pendrop.yml
  const pipelineConfig = projectConfig.pipelines?.[pipeline];
  
  if (!pipelineConfig) {
    throw new Error(`Pipeline '${pipeline}' not configured in pendrop.yml`);
  }

  const tasksPackage = pipelineConfig.tasks;

  // 3. Load merged config (assets and variables from all sources)
  const mergedConfig = await loadMergedConfig(project_path, pipeline, tasksPackage);

  // 4. Load Tasks & Pipeline
  const tasksData = await loadTasks(tasksPackage, repoRoot);
  
  // The tasks define which pipeline definition to use
  const pipelineData = await loadPipeline(tasksData.pipeline, repoRoot);

  // 5. Resolve Steps
  const stepsToRun = resolveSteps(pipelineData.steps, step);

  // 6. Base Variables (Global)
  // Priority: Runtime > Merged Config Variables
  const baseVariables: Record<string, any> = {
    project_path,
    ...mergedConfig.variables,
    ...variables
  };

  // 6. Assemble Instructions
  let composedInstructions = '';

  for (const stepId of stepsToRun) {
    const pipelineStep = pipelineData.steps[stepId];
    const taskStep = tasksData.steps[stepId];

    // Step Header
    composedInstructions += `# Step: ${pipelineStep.description}\n\n`;

    if (taskStep && taskStep.template) {
      // Process template
      // Variables are already merged in baseVariables, step specific variables aren't separate anymore in new design
      // If we wanted step-specific vars in tasks.yml, we'd need to support that. 
      // Current plan moved template to tasks.yml, but didn't specify step-level variables.
      // Assuming variables are global for now or embedded in template.
      
      const stepOutput = replaceTemplateVariables(taskStep.template, baseVariables);
      composedInstructions += stepOutput + '\n\n';
    } else {
      // If no template in tasks, skip or warn? 
      // Maybe purely structural step?
    }
  }

  return {
    instructions: composedInstructions.trim()
  };
}
