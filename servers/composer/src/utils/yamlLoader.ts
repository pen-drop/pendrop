import yaml from 'js-yaml';
import { resolver } from './resolver.js';

// Custom types
const IncludeType = new yaml.Type('!include', {
  kind: 'scalar',
  construct: (data) => {
    return { __include__: data };
  }
});

const SCHEMA = yaml.DEFAULT_SCHEMA.extend([IncludeType]);

export class YamlLoader {
  /**
   * Load YAML from a path or URL, resolving !include tags
   */
  async load(target: string, contextPath: string): Promise<any> {
    const loadedPaths = new Set<string>();

    const resolveRecursively = async (obj: any, currentContext: string): Promise<any> => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      // Handle !include
      if (obj.__include__) {
        const includeTarget = obj.__include__;
        return await loadRecursive(includeTarget, currentContext);
      }

      // Handle array
      if (Array.isArray(obj)) {
        return Promise.all(obj.map(item => resolveRecursively(item, currentContext)));
      }

      // Handle object
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = await resolveRecursively(value, currentContext);
      }
      return result;
    };

    const loadRecursive = async (target: string, currentContext: string): Promise<any> => {
      // Resolve target to absolute path/url
      const { content, path: resolvedPath } = await resolver.resolve(target, currentContext);

      if (loadedPaths.has(resolvedPath)) {
        // Prevent circular dependency infinite loop
        return {}; 
      }
      loadedPaths.add(resolvedPath);

      // Parse YAML
      let parsed: any;
      try {
        parsed = yaml.load(content, { schema: SCHEMA });
      } catch (e) {
        throw new Error(`Failed to parse YAML from ${resolvedPath}: ${e}`);
      }

      // Recursively resolve tags within the parsed content
      // The context for includes inside this file is THIS file's path
      return await resolveRecursively(parsed, resolvedPath);
    };

    return loadRecursive(target, contextPath);
  }
}

export const yamlLoader = new YamlLoader();
