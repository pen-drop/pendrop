import { resolve, join } from 'path';
import { existsSync } from 'fs';

/**
 * Get the repository root directory
 * Traverses up from current working directory until it finds pendrop.yml or .git
 */
export function getRepositoryRoot(): string {
  // Use process.cwd() as start point
  let currentDir = process.cwd();
  
  // Check up to 5 levels up
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(currentDir, 'pendrop.yml')) || existsSync(join(currentDir, '.git'))) {
      return currentDir;
    }
    
    const parentDir = resolve(currentDir, '..');
    if (parentDir === currentDir) {
      break; // Reached root
    }
    currentDir = parentDir;
  }
  
  // Fallback to process.cwd()
  return process.cwd();
}

