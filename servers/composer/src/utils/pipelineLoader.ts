import { readFile } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';
import type { ConfigSection } from '../types/config.js';

export interface PipelineStep {
  id: string;
  description: string;
  dependencies?: string[];
}

export interface Pipeline extends ConfigSection {
  steps: Record<string, PipelineStep>;
  rawPipeline: Record<string, unknown>;
}

/**
 * Load a pipeline from the composer/pipelines directory
 * @param pipelineName - Name of the pipeline directory
 * @param composerRoot - Root path where composer directory resides (usually repository root)
 */
export async function loadPipeline(pipelineName: string, composerRoot: string): Promise<Pipeline> {
  const pipelineDir = join(composerRoot, 'composer/pipelines', pipelineName);
  const pipelinePath = join(pipelineDir, 'pipeline.yaml');

  let pipelineContent: string;

  try {
    pipelineContent = await readFile(pipelinePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load pipeline from ${pipelinePath}: ${error}`);
  }

  const rawPipeline = yaml.load(pipelineContent) as any;

  // Validate steps
  const steps: Record<string, PipelineStep> = {};
  if (rawPipeline.steps) {
    for (const [key, value] of Object.entries(rawPipeline.steps as Record<string, any>)) {
      steps[key] = {
        id: key,
        description: value.description || '',
        dependencies: value.dependencies || []
      };
    }
  }

  return {
    steps,
    assets: rawPipeline.assets || {},
    variables: rawPipeline.variables || {},
    rawPipeline
  };
}
