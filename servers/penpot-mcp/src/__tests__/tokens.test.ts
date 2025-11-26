
import { PenpotMCPServer } from '../server/mcpServer';

// Mock the module
jest.mock('../api/penpotApi', () => {
  return {
    PenpotAPI: jest.fn().mockImplementation(() => ({
      getFile: jest.fn(),
      listProjects: jest.fn(),
      getProjectFiles: jest.fn(),
    })),
    CloudFlareError: class extends Error {
      statusCode?: number;
      responseText?: string;
      constructor(message: string, statusCode?: number, responseText?: string) {
        super(message);
        this.statusCode = statusCode;
        this.responseText = responseText;
      }
    },
    PenpotAPIError: class extends Error {
      statusCode?: number;
      responseText?: string;
      isCloudflare: boolean;
      constructor(message: string, statusCode?: number, responseText?: string, isCloudflare: boolean = false) {
        super(message);
        this.statusCode = statusCode;
        this.responseText = responseText;
        this.isCloudflare = isCloudflare;
      }
    }
  };
});

describe('PenpotMCPServer - get_tokens', () => {
  let server: PenpotMCPServer;
  let mockApi: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize server (which creates the mock API)
    server = new PenpotMCPServer('Test Server', true);
    
    // Get the mock API instance
    mockApi = (server as any).api;
  });

  test('should return tokensLib when available', async () => {
    const fileId = 'file-with-tokens';
    const mockTokensLib = {
      tokens: {
        'color.primary': {
          value: '#FF0000',
          type: 'color'
        }
      }
    };
    
    const mockFileData = {
      data: {
        id: fileId,
        tokensLib: mockTokensLib
      }
    };

    mockApi.getFile.mockResolvedValue(mockFileData);

    // Access private method
    const result = await (server as any).toolGetTokens(fileId);

    expect(mockApi.getFile).toHaveBeenCalledWith(fileId);
    
    // Parse result
    const resultData = JSON.parse(result.content[0].text);
    expect(resultData).toEqual(mockTokensLib);
  });

  test('should return error when tokensLib is missing', async () => {
    const fileId = 'file-no-tokens';
    const mockFileData = {
      data: {
        id: fileId
        // No tokensLib
      }
    };

    mockApi.getFile.mockResolvedValue(mockFileData);

    const result = await (server as any).toolGetTokens(fileId);

    expect(mockApi.getFile).toHaveBeenCalledWith(fileId);
    const parsedResult = JSON.parse(result.content[0].text);
    expect(parsedResult).toHaveProperty('error');
    expect(parsedResult.error).toContain('No tokens library found');
  });

  test('should return error when tokensLib is null', async () => {
    const fileId = 'file-null-tokens';
    const mockFileData = {
      data: {
        id: fileId,
        tokensLib: null
      }
    };

    mockApi.getFile.mockResolvedValue(mockFileData);

    const result = await (server as any).toolGetTokens(fileId);

    expect(mockApi.getFile).toHaveBeenCalledWith(fileId);
    const parsedResult = JSON.parse(result.content[0].text);
    expect(parsedResult).toHaveProperty('error');
    expect(parsedResult.error).toContain('No tokens library found');
  });

  test('should handle API errors', async () => {
    const fileId = 'error-file';
    const errorMessage = 'API Error';
    
    mockApi.getFile.mockRejectedValue(new Error(errorMessage));

    const result = await (server as any).toolGetTokens(fileId);

    expect(mockApi.getFile).toHaveBeenCalledWith(fileId);
    const parsedResult = JSON.parse(result.content[0].text);
    expect(parsedResult).toHaveProperty('error');
    expect(parsedResult.error).toContain(errorMessage);
  });
});

