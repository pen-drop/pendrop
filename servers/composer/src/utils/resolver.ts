import { resolve, dirname, isAbsolute, join } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import axios from 'axios';

export interface ResolutionResult {
  content: string;
  path: string; // Absolute path or URL
}

export class Resolver {
  /**
   * Resolve a target path/URL relative to a context path
   * @param target - The path, URL, or package reference to resolve
   * @param contextPath - The absolute path of the file containing the reference
   * @returns Promise resolving to the content and absolute location
   */
  async resolve(target: string, contextPath: string): Promise<ResolutionResult> {
    // 1. HTTPS / HTTP
    if (target.startsWith('http://') || target.startsWith('https://')) {
      return this.resolveUrl(target);
    }

    // 2. Package (npm://)
    if (target.startsWith('npm://')) {
      return this.resolvePackage(target.substring(6));
    }

    // 3. Absolute Path
    if (isAbsolute(target)) {
        return this.resolveFile(target);
    }

    // 4. Relative Path (explicit ./ or ../)
    if (target.startsWith('./') || target.startsWith('../')) {
      const absPath = resolve(dirname(contextPath), target);
      return this.resolveFile(absPath);
    }

    // 5. Fallback: Try package resolution, then assume relative file path
    try {
        return await this.resolvePackage(target);
    } catch {
        // Not a package, treat as relative to context file
        const absPath = resolve(dirname(contextPath), target);
        return this.resolveFile(absPath);
    }
  }

  private async resolveUrl(url: string): Promise<ResolutionResult> {
    try {
      const response = await axios.get(url, { responseType: 'text' });
      return {
        content: response.data,
        path: url
      };
    } catch (error) {
      throw new Error(`Failed to fetch URL ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async resolvePackage(packageName: string): Promise<ResolutionResult> {
    try {
      // Use node's require.resolve to find the file
      // We might need to handle specific files inside packages like "pkg/file.yaml"
      // @ts-ignore - import.meta.resolve might not be typed in all environments
      const resolveFn = import.meta.resolve;
      
      const absPath = resolveFn
        ? new URL(await resolveFn(packageName)).pathname 
        : require.resolve(packageName);
      
      return this.resolveFile(absPath);
    } catch (error) {
        // Try simple require resolve for commonjs compat
        try {
            const absPath = require.resolve(packageName, { paths: [process.cwd()] });
            return this.resolveFile(absPath);
        } catch {
             throw new Error(`Failed to resolve package ${packageName}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
  }

  private async resolveFile(path: string): Promise<ResolutionResult> {
    try {
      if (!existsSync(path)) {
        throw new Error(`File not found: ${path}`);
      }
      const content = await readFile(path, 'utf-8');
      return {
        content,
        path
      };
    } catch (error) {
      throw new Error(`Failed to read file ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const resolver = new Resolver();
