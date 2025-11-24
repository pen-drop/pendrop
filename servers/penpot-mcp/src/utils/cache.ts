/**
 * Cache utilities for Penpot MCP server.
 */

/**
 * Cached data structure
 */
interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

/**
 * In-memory cache implementation with TTL support.
 */
export class MemoryCache<T = any> {
  private ttlSeconds: number;
  private cache: Map<string, CacheEntry<T>>;

  /**
   * Initialize the memory cache.
   * @param ttlSeconds - Time to live in seconds (default 10 minutes)
   */
  constructor(ttlSeconds: number = 600) {
    this.ttlSeconds = ttlSeconds;
    this.cache = new Map();
  }

  /**
   * Get a file from cache if it exists and is not expired.
   * @param fileId - The ID of the file to retrieve
   * @returns The cached file data or null if not found/expired
   */
  get(fileId: string): T | null {
    const cacheData = this.cache.get(fileId);
    
    if (!cacheData) {
      return null;
    }

    // Check if cache is expired
    const now = Date.now() / 1000; // Convert to seconds
    if (now - cacheData.timestamp > this.ttlSeconds) {
      this.cache.delete(fileId); // Remove expired cache
      return null;
    }

    return cacheData.data;
  }

  /**
   * Store a file in cache.
   * @param fileId - The ID of the file to cache
   * @param data - The file data to cache
   */
  set(fileId: string, data: T): void {
    this.cache.set(fileId, {
      timestamp: Date.now() / 1000, // Convert to seconds
      data
    });
  }

  /**
   * Clear all cached files.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get all valid cached files.
   * @returns Dictionary mapping file IDs to their cached data
   */
  getAllCachedFiles(): Record<string, T> {
    const result: Record<string, T> = {};
    const now = Date.now() / 1000; // Convert to seconds

    // Create a list of expired keys to remove
    const expiredKeys: string[] = [];

    for (const [fileId, cacheData] of this.cache.entries()) {
      if (now - cacheData.timestamp <= this.ttlSeconds) {
        result[fileId] = cacheData.data;
      } else {
        expiredKeys.push(fileId);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      this.cache.delete(key);
    }

    return result;
  }
}

