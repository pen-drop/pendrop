import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runWorkflow } from '../src/composerEngine.js';
import { join } from 'path';
import { readdir, readFile, writeFile, mkdir, rm, stat } from 'fs/promises';
import yaml from 'js-yaml';

const fixturesDir = join(process.cwd(), 'tests/fixtures/cases');

// Helper to load test definition
async function loadTestDef(caseDir: string) {
  return yaml.load(await readFile(join(caseDir, 'test.yml'), 'utf-8')) as any;
}

describe('YAML Integration Tests', async () => {
  let cases: string[] = [];
  try {
    cases = await readdir(fixturesDir);
  } catch (e) {
    console.warn(`No fixtures found in ${fixturesDir}`);
  }
  
  for (const caseName of cases) {
    if (caseName.startsWith('.')) continue;
    
    const caseDir = join(fixturesDir, caseName);
    let hasTestFile = false;
    try {
        const stats = await stat(join(caseDir, 'test.yml'));
        if (stats.isFile()) hasTestFile = true;
    } catch (e) {
        // Ignore missing file
    }

    if (!hasTestFile) continue;

    describe(caseName, () => {
      const tempDir = join(process.cwd(), 'tests/temp', caseName);

      beforeEach(async () => {
        await mkdir(tempDir, { recursive: true });
        const testDef = await loadTestDef(caseDir);
        
        // Write files
        if (testDef.files) {
            for (const [filename, content] of Object.entries(testDef.files)) {
                await writeFile(join(tempDir, filename), content as string);
            }
        }
      });

      afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
      });

      it('should pass expectations', async () => {
        const testDef = await loadTestDef(caseDir);
        
        try {
            const result = await runWorkflow({
                workflow: testDef.run.workflow,
                task: testDef.run.task,
                step: testDef.run.step,
                project_path: tempDir,
                variables: testDef.run.variables
            });

            if (testDef.expect.instructions) {
                const expectedList = Array.isArray(testDef.expect.instructions) 
                    ? testDef.expect.instructions 
                    : [testDef.expect.instructions];
                
                for (const expected of expectedList) {
                    expect(result.instructions).toContain(expected);
                }
            }
        } catch (error) {
            if (testDef.expect.error) {
                expect((error as Error).message).toMatch(new RegExp(testDef.expect.error));
            } else {
                throw error;
            }
        }
      });
    });
  }
});
