import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workflowLoader } from '../src/utils/workflowLoader.js';
import { resolver } from '../src/utils/resolver.js';
import yaml from 'js-yaml';

vi.mock('../src/utils/resolver.js', () => ({
  resolver: {
    resolve: vi.fn()
  }
}));

describe('WorkflowLoader', () => {
  const contextPath = '/root/main.yaml';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load a simple workflow', async () => {
    const yamlContent = yaml.dump({
      variables: { foo: 'bar' },
      steps: { step1: { task: 'hi' } }
    });

    (resolver.resolve as any).mockResolvedValue({
      content: yamlContent,
      path: '/root/simple.yaml'
    });

    const result = await workflowLoader.load('./simple.yaml', contextPath);
    expect(result.variables).toEqual({ foo: 'bar' });
    expect(result.steps).toHaveProperty('step1');
  });

  it('should support !include tag', async () => {
    // base.yaml content (steps object)
    const baseContent = yaml.dump({
      step1: { task: 'base task' }
    });

    // main.yaml using !include
    // Note: In YAML, tags are space separated.
    const mainContent = `
variables:
  foo: bar
steps: !include ./base.yaml
`;

    (resolver.resolve as any).mockImplementation(async (target: string) => {
      if (target.includes('main')) return { content: mainContent, path: '/root/main.yaml' };
      if (target.includes('base')) return { content: baseContent, path: '/root/base.yaml' };
      return { content: '', path: '' };
    });

    const result = await workflowLoader.load('./main.yaml', contextPath);
    
    expect(result.variables).toEqual({ foo: 'bar' });
    expect(result.steps).toEqual({ step1: { task: 'base task' } });
  });

  it('should handle circular dependencies gracefully', async () => {
    // a.yaml includes b.yaml
    const aContent = `
variables:
  a: 1
other: !include ./b.yaml
`;
    // b.yaml includes a.yaml
    const bContent = `
variables:
  b: 1
other: !include ./a.yaml
`;

    (resolver.resolve as any).mockImplementation(async (target: string) => {
      if (target.includes('a.yaml')) return { content: aContent, path: '/root/a.yaml' };
      if (target.includes('b.yaml')) return { content: bContent, path: '/root/b.yaml' };
      return { content: '', path: '' };
    });

    const result = await workflowLoader.load('./a.yaml', contextPath);
    
    expect(result.variables).toEqual({ a: 1 });
    // b.yaml is loaded, but its include of a.yaml should return empty object/placeholder to avoid loop
    expect(result.other.variables).toEqual({ b: 1 });
    expect(result.other.other).toEqual({}); // Circular ref stopped
  });
});
