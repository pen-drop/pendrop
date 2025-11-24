/**
 * Tests for config module.
 */

import * as config from '../utils/config';

describe('Config', () => {
  test('should have expected config values and types', () => {
    expect(typeof config.PORT).toBe('number');
    expect(typeof config.DEBUG).toBe('boolean');
    expect(typeof config.PENPOT_API_URL).toBe('string');
    expect(config.RESOURCES_PATH).toBeDefined();
    expect(typeof config.RESOURCES_PATH).toBe('string');
  });

  test('should have valid default values', () => {
    expect(config.PORT).toBeGreaterThan(0);
    expect(config.PENPOT_API_URL).toContain('http');
    expect(config.RESOURCES_PATH).toBeTruthy();
  });

  test('should have HTTP server configuration', () => {
    expect(typeof config.ENABLE_HTTP_SERVER).toBe('boolean');
    expect(typeof config.HTTP_SERVER_HOST).toBe('string');
    expect(typeof config.HTTP_SERVER_PORT).toBe('number');
  });

  test('should have MCP mode configuration', () => {
    expect(typeof config.MODE).toBe('string');
    expect(['stdio', 'sse'].includes(config.MODE)).toBe(true);
  });

  test('should have resources as tools configuration', () => {
    expect(typeof config.RESOURCES_AS_TOOLS).toBe('boolean');
  });
});

