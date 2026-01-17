import { yamlLoader } from './yamlLoader.js';

export interface WorkflowDefinition {
  variables?: Record<string, any>;
  assets?: Record<string, any>;
  steps?: Record<string, any>;
  tasks?: Record<string, any>;
  rules?: Record<string, any>;
  [key: string]: any; // Allow other keys for flexibility
}

export class WorkflowLoader {
  /**
   * Load a workflow definition from a path or URL
   * recursively processing includes via yamlLoader
   */
  async load(target: string, contextPath: string): Promise<WorkflowDefinition> {
    const result = await yamlLoader.load(target, contextPath);
    
    // Ensure it looks like a workflow definition
    if (result && typeof result === 'object' && !Array.isArray(result)) {
        return result as WorkflowDefinition;
    }
    return result; 
  }
}

export const workflowLoader = new WorkflowLoader();
