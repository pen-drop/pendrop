/**
 * Tests for the memory caching functionality.
 */

import { MemoryCache } from '../utils/cache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    // Create a MemoryCache instance with a short TTL for testing
    cache = new MemoryCache(2); // 2 seconds
  });

  afterEach(() => {
    cache.clear();
  });

  test('should set and get data from cache', () => {
    const testData = { test: 'data' };
    const fileId = 'test123';

    // Set data in cache
    cache.set(fileId, testData);

    // Get data from cache
    const cachedData = cache.get(fileId);
    expect(cachedData).toEqual(testData);
  });

  test('should expire cached files after TTL', async () => {
    const testData = { test: 'data' };
    const fileId = 'test123';

    // Set data in cache
    cache.set(fileId, testData);

    // Data should be available immediately
    expect(cache.get(fileId)).toEqual(testData);

    // Wait for cache to expire (2 seconds + buffer)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Data should be expired
    expect(cache.get(fileId)).toBeNull();
  });

  test('should clear the cache', () => {
    const testData = { test: 'data' };
    const fileId = 'test123';

    // Set data in cache
    cache.set(fileId, testData);

    // Verify data is cached
    expect(cache.get(fileId)).toEqual(testData);

    // Clear cache
    cache.clear();

    // Verify data is gone
    expect(cache.get(fileId)).toBeNull();
  });

  test('should get all cached files', async () => {
    const testData1 = { test: 'data1' };
    const testData2 = { test: 'data2' };

    // Set multiple files in cache
    cache.set('file1', testData1);
    cache.set('file2', testData2);

    // Get all cached files
    let allFiles = cache.getAllCachedFiles();

    // Verify all files are present
    expect(Object.keys(allFiles).length).toBe(2);
    expect(allFiles['file1']).toEqual(testData1);
    expect(allFiles['file2']).toEqual(testData2);

    // Wait for cache to expire
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Verify expired files are removed
    allFiles = cache.getAllCachedFiles();
    expect(Object.keys(allFiles).length).toBe(0);
  });

  test('should return null for nonexistent file', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  test('should handle multiple set operations on same key', () => {
    const fileId = 'test123';
    const data1 = { test: 'data1' };
    const data2 = { test: 'data2' };

    cache.set(fileId, data1);
    expect(cache.get(fileId)).toEqual(data1);

    cache.set(fileId, data2);
    expect(cache.get(fileId)).toEqual(data2);
  });
});

