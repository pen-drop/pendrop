import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { templateEngine } from '../src/utils/templateEngine.js';
import { resolver } from '../src/utils/resolver.js';
import { join } from 'path';

// Mock resolver
vi.mock('../src/utils/resolver.js', () => ({
  resolver: {
    resolve: vi.fn()
  }
}));

describe('TemplateEngine', () => {
  const contextPath = '/home/user/project/file.yaml';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render standard handlebars variables', async () => {
    const template = 'Hello {{name}}!';
    const context = { name: 'World' };
    const result = await templateEngine.render(template, context, contextPath);
    expect(result).toBe('Hello World!');
  });

  it('should support {{json}} helper', async () => {
    const template = '{{json obj}}';
    const context = { obj: { a: 1 } };
    const result = await templateEngine.render(template, context, contextPath);
    expect(result).toContain('"a": 1');
  });

  it('should support async {{read}} helper', async () => {
    (resolver.resolve as any).mockResolvedValue({
      content: 'file content',
      path: '/abs/path'
    });

    const template = 'Content: {{read "./file.txt"}}';
    const result = await templateEngine.render(template, {}, contextPath);
    
    expect(resolver.resolve).toHaveBeenCalledWith('./file.txt', contextPath);
    expect(result).toBe('Content: file content');
  });

  it('should support async {{resolve}} helper', async () => {
    (resolver.resolve as any).mockResolvedValue({
      content: 'file content',
      path: '/abs/path/file.txt'
    });

    const template = 'Path: {{resolve "./file.txt"}}';
    const result = await templateEngine.render(template, {}, contextPath);
    
    expect(resolver.resolve).toHaveBeenCalledWith('./file.txt', contextPath);
    expect(result).toBe('Path: /abs/path/file.txt');
  });

  it('should handle errors in async helpers', async () => {
    (resolver.resolve as any).mockRejectedValue(new Error('Fetch failed'));

    const template = 'Content: {{read "bad.url"}}';
    const result = await templateEngine.render(template, {}, contextPath);
    
    expect(result).toContain('[Error reading bad.url: Error: Fetch failed]');
  });
});

