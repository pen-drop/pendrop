/**
 * Jest setup file for tests.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DEBUG = 'false';
process.env.ENABLE_HTTP_SERVER = 'false';
process.env.PORT = '5555';
process.env.PENPOT_API_URL = 'https://test.penpot.app/api';

// Increase timeout for async tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
};

