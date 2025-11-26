/**
 * Asset Manager
 * Handles loading, extracting, and saving assets
 */

import { readFile, writeFile, mkdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { JSONPath } from 'jsonpath-plus';
import type { AssetDefinition, Assets, Variables } from '../types/config.js';

// Simple in-memory cache
const assetCache = new Map<string, { content: any; timestamp: number }>();

/**
 * Resolve variables in asset URL/path
 */
export function resolveAssetPath(
  assetDef: AssetDefinition,
  variables: Variables
): string {
  const pathOrUrl = assetDef.url || assetDef.path;
  if (!pathOrUrl) {
    throw new Error('Asset definition must have either url or path');
  }

  let resolved = pathOrUrl;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    resolved = resolved.split(placeholder).join(String(value));
  }

  return resolved;
}

/**
 * Deep merge utility function
 * Recursively merges objects, arrays are replaced, primitives are replaced
 */
export function deepMerge(target: any, source: any): any {
  if (source === null || source === undefined) {
    return target;
  }

  if (Array.isArray(source) || Array.isArray(target)) {
    return source; // Arrays are replaced entirely
  }

  if (typeof source === 'object' && typeof target === 'object') {
    const merged = { ...target };
    for (const [key, value] of Object.entries(source)) {
      if (key in merged && typeof merged[key] === 'object' && typeof value === 'object' && !Array.isArray(value) && !Array.isArray(merged[key])) {
        merged[key] = deepMerge(merged[key], value);
      } else {
        merged[key] = value;
      }
    }
    return merged;
  }

  return source; // Primitives are replaced
}

/**
 * Load asset from URL or path and cache it
 */
export async function loadAsset(
  assetId: string,
  assets: Assets,
  projectPath: string,
  variables: Variables
): Promise<any> {
  const assetDef = assets[assetId];
  if (!assetDef) {
    throw new Error(`Asset '${assetId}' not found`);
  }

  const resolvedPath = resolveAssetPath(assetDef, variables);
  const cacheKey = `${assetId}:${resolvedPath}`;

  // Check cache
  const cached = assetCache.get(cacheKey);
  if (cached) {
    // Check if file was modified (for local files)
    if (assetDef.path) {
      try {
        const stats = await stat(resolvedPath);
        if (stats.mtimeMs <= cached.timestamp) {
          return cached.content;
        }
      } catch {
        // File doesn't exist or error, reload
      }
    } else {
      // For URLs, use cached version
      return cached.content;
    }
  }

  // Load asset
  let content: any;
  if (assetDef.url) {
    // Fetch from URL (only HTTP/HTTPS, not file://)
    if (resolvedPath.startsWith('http://') || resolvedPath.startsWith('https://')) {
      const response = await fetch(resolvedPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch asset from ${resolvedPath}: ${response.statusText}`);
      }
      content = await response.json();
    } else {
      // Local file path passed as URL
      const fullPath = resolvedPath.startsWith('/')
        ? resolvedPath
        : join(projectPath, resolvedPath);
      const fileContent = await readFile(fullPath, 'utf-8');
      content = JSON.parse(fileContent);
    }
  } else if (assetDef.path) {
    // Read from file
    const fullPath = resolvedPath.startsWith('/') 
      ? resolvedPath 
      : join(projectPath, resolvedPath);
    const fileContent = await readFile(fullPath, 'utf-8');
    content = JSON.parse(fileContent);
  } else {
    throw new Error('Asset definition must have either url or path');
  }

  // Cache it
  const timestamp = assetDef.path 
    ? (await stat(resolvedPath.startsWith('/') ? resolvedPath : join(projectPath, resolvedPath))).mtimeMs
    : Date.now();
  assetCache.set(cacheKey, { content, timestamp });

  return content;
}

/**
 * Extract parts from asset using JSONPath
 */
export async function extractAsset(
  assetId: string,
  jsonpath: string,
  options: { minify?: boolean } = {},
  assets: Assets,
  projectPath: string,
  variables: Variables
): Promise<string> {
  const content = await loadAsset(assetId, assets, projectPath, variables);
  
  // Extract using JSONPath
  const extracted = JSONPath({ path: jsonpath, json: content });
  
  // Handle single result vs array
  const result = extracted.length === 1 ? extracted[0] : extracted;
  
  // Stringify with or without minification
  if (options.minify) {
    return JSON.stringify(result);
  }
  return JSON.stringify(result, null, 2);
}

/**
 * Save data to writeable asset with deep merge
 */
export async function saveAsset(
  assetId: string,
  data: any,
  assets: Assets,
  projectPath: string,
  variables: Variables,
  options: {
    merge?: boolean;
    validate?: boolean;
    dryrun?: boolean;
  } = {}
): Promise<{
  success: boolean;
  path?: string;
  message?: string;
  error?: string;
}> {
  const assetDef = assets[assetId];
  if (!assetDef) {
    throw new Error(`Asset '${assetId}' not found`);
  }

  if (!assetDef.writeable) {
    return {
      success: false,
      error: `Asset '${assetId}' is not writeable`
    };
  }

  if (!assetDef.path) {
    return {
      success: false,
      error: `Asset '${assetId}' must have a path to be writeable`
    };
  }

  const resolvedPath = resolveAssetPath(assetDef, variables);
  const fullPath = resolvedPath.startsWith('/')
    ? resolvedPath
    : join(projectPath, resolvedPath);

  // Load existing content if merge is enabled
  let existingContent: any = {};
  if (options.merge) {
    try {
      const fileContent = await readFile(fullPath, 'utf-8');
      existingContent = JSON.parse(fileContent);
    } catch {
      // File doesn't exist, start with empty object
      existingContent = {};
    }
  }

  // Merge if needed
  const finalContent = options.merge
    ? deepMerge(existingContent, data)
    : data;

  // Validate against schema if provided
  if (options.validate && assetDef.schema) {
    // TODO: Implement schema validation
    // For now, skip validation
  }

  // Dryrun mode
  if (options.dryrun) {
    return {
      success: true,
      message: `Asset '${assetId}' would be saved (dryrun mode)`
    };
  }

  // Ensure directory exists
  await mkdir(dirname(fullPath), { recursive: true });

  // Write file
  await writeFile(fullPath, JSON.stringify(finalContent, null, 2), 'utf-8');

  // Clear cache for this asset
  const cacheKey = `${assetId}:${resolvedPath}`;
  assetCache.delete(cacheKey);

  return {
    success: true,
    path: fullPath,
    message: `Asset '${assetId}' saved successfully`
  };
}

