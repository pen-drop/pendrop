#!/usr/bin/env node
import { Command } from 'commander';
import { runWorkflow } from './composerEngine.js';
import { resolve } from 'path';

const program = new Command();

program
  .name('composer')
  .description('Pendrop Composer CLI')
  .version('1.0.0');

program
  .command('run')
  .description('Run a workflow')
  .argument('<project_path>', 'Path to the project root containing pendrop.yml')
  .argument('<workflow>', 'Name of the workflow in pendrop.yml')
  .argument('[task...]', 'Specific task(s) to run (optional)')
  .option('-c, --config <filename>', 'Custom configuration filename', 'pendrop.yml')
  .option('-s, --step <step>', 'Filter by step(s)', (value, previous: string[]) => {
    return previous.concat([value]);
  }, [])
  .option('-v, --var <key=value...>', 'Set variables', (value, previous: Record<string, any>) => {
    const [key, val] = value.split('=');
    previous[key] = val;
    return previous;
  }, {})
  .action(async (projectPath, workflow, tasks, options) => {
    try {
      const absProjectPath = resolve(process.cwd(), projectPath);
      
      console.error(`Running workflow '${workflow}' in '${absProjectPath}'...`);
      if (options.config !== 'pendrop.yml') {
        console.error(`Config: ${options.config}`);
      }
      if (tasks.length > 0) {
        console.error(`Tasks: ${tasks.join(', ')}`);
      }
      if (options.step.length > 0) {
        console.error(`Steps: ${options.step.join(', ')}`);
      }

      const result = await runWorkflow({
        workflow,
        project_path: absProjectPath,
        pendrop_file: options.config,
        task: tasks.length > 0 ? tasks : undefined,
        step: options.step.length > 0 ? options.step : undefined,
        variables: options.var
      });

      console.log(result.instructions);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
