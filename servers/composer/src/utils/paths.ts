import { resolve, join } from 'path';
import { existsSync } from 'fs';

/**
 * Get the repository root directory
 * Traverses up from current working directory until it finds pendrop.yml or .git
 */
export function getRepositoryRoot(): string {
  // If running via run-compose.ts in development, we might be deep in src
  // But we want the repository root /home/cw/projects/pendrop
  
  // Use process.cwd() as start point
  let currentDir = process.cwd();
  
  // Check up to 8 levels up
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(currentDir, 'composer')) && existsSync(join(currentDir, 'servers'))) {
      return currentDir;
    }
    
    const parentDir = resolve(currentDir, '..');
    if (parentDir === currentDir) {
      break; // Reached root
    }
    currentDir = parentDir;
  }
  
  // Fallback for development environment where we know the path structure
  if (process.cwd().includes('/servers/composer')) {
      return resolve(process.cwd().split('/servers/composer')[0]);
  }

  // Fallback to process.cwd()
  return process.cwd();
}
