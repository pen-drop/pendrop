/**
 * Unit tests for Save Design Data Tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveDesignData } from '../../src/tools/save.js';
import * as fs from 'fs/promises';
import { join } from 'path';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  readFile: vi.fn(),
}));

// Mock logger
vi.mock('../../src/utils/mcpLogger.js', () => ({
  setLoggerProjectPath: vi.fn(),
}));

describe('Save Design Data Tool', () => {
  const mockProjectPath = '/mock/project/path';
  const mockOutputPath = join(mockProjectPath, '.pendrop/pendrop.data.ds.json');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create file if it does not exist', async () => {
    // Mock readFile to fail (file not found)
    vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

    const params = {
      data: { "comp1": { variants: [] } },
      project_path: mockProjectPath,
      type: 'components' as const
    };

    const result = await saveDesignData(params);

    expect(result.success).toBe(true);
    expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('.pendrop'), { recursive: true });
    
    // Check if written content has the structure { components: { ... } }
    const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
    expect(writeCall[0]).toBe(mockOutputPath);
    
    const writtenContent = JSON.parse(writeCall[1] as string);
    expect(writtenContent).toEqual({
      components: {
        "comp1": { variants: [] }
      }
    });
  });

  it('should merge data if file exists', async () => {
    // Mock readFile to return existing content
    const existingContent = {
      components: {
        "existingComp": { variants: [] }
      },
      tokens: {}
    };
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingContent));

    const params = {
      data: { "newComp": { variants: [] } },
      project_path: mockProjectPath,
      type: 'components' as const
    };

    const result = await saveDesignData(params);

    expect(result.success).toBe(true);
    
    const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
    const writtenContent = JSON.parse(writeCall[1] as string);
    
    expect(writtenContent).toEqual({
      components: {
        "existingComp": { variants: [] },
        "newComp": { variants: [] }
      },
      tokens: {}
    });
  });

  it('should overwrite existing item in same type', async () => {
    const existingContent = {
      components: {
        "comp1": { name: "Original" }
      }
    };
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingContent));

    const params = {
      data: { "comp1": { name: "Updated" } },
      project_path: mockProjectPath,
      type: 'components' as const
    };

    await saveDesignData(params);
    
    const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
    const writtenContent = JSON.parse(writeCall[1] as string);
    
    expect(writtenContent.components["comp1"].name).toBe("Updated");
  });

  it('should handle different types correctly (tokens)', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

    const params = {
      data: { "color.primary": { $value: "#000" } },
      project_path: mockProjectPath,
      type: 'tokens' as const
    };

    await saveDesignData(params);
    
    const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
    const writtenContent = JSON.parse(writeCall[1] as string);
    
    expect(writtenContent).toEqual({
      tokens: {
        "color.primary": { $value: "#000" }
      }
    });
  });

  it('should handle different types correctly (stories)', async () => {
    const existingContent = {
      components: {},
      tokens: {}
    };
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingContent));

    const params = {
      data: { "story1": {} },
      project_path: mockProjectPath,
      type: 'stories' as const
    };

    await saveDesignData(params);
    
    const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
    const writtenContent = JSON.parse(writeCall[1] as string);
    
    expect(writtenContent).toEqual({
      components: {},
      tokens: {},
      stories: {
        "story1": {}
      }
    });
  });
});

