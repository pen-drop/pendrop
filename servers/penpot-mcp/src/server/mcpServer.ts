/**
 * Main MCP server implementation for Penpot.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PenpotAPI, CloudFlareError, PenpotAPIError } from '../api/penpotApi';
import { getObjectSubtreeWithFields } from '../tools/penpotTree';
import { MemoryCache } from '../utils/cache';
import * as config from '../utils/config';
import { ImageServer } from '../utils/httpServer';

/**
 * Image data structure for MCP
 */
interface MCPImage {
  data: string; // base64 encoded
  mimeType: string;
  httpUrl?: string;
}

/**
 * Penpot MCP Server implementation
 */
export class PenpotMCPServer {
  private server: Server;
  private api: PenpotAPI;
  private fileCache: MemoryCache;
  private renderedComponents: Map<string, MCPImage>;
  private imageServer: ImageServer | null;
  private imageServerUrl: string | null;

  constructor(name: string = 'Penpot MCP Server', testMode: boolean = false) {
    // Initialize the MCP server
    this.server = new Server(
      {
        name,
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Initialize the Penpot API
    this.api = new PenpotAPI(config.PENPOT_API_URL, config.DEBUG);

    // Initialize memory cache
    this.fileCache = new MemoryCache(600); // 10 minutes

    // Storage for rendered component images
    this.renderedComponents = new Map();

    // Initialize HTTP server for images if enabled and not in test mode
    this.imageServer = null;
    this.imageServerUrl = null;

    const isTestEnv = testMode || process.env.NODE_ENV === 'test';

    if (config.ENABLE_HTTP_SERVER && !isTestEnv) {
      try {
        this.imageServer = new ImageServer(config.HTTP_SERVER_HOST, config.HTTP_SERVER_PORT);
      } catch (e) {
        console.error(`Warning: Failed to start image server: ${e}`);
      }
    }

    // Register handlers
    this.registerHandlers();
  }

  /**
   * Handle API errors and return user-friendly error messages
   */
  private handleApiError(e: Error): any {
    if (e instanceof CloudFlareError) {
      return {
        error: 'CloudFlare Protection',
        message: e.message,
        error_type: 'cloudflare_protection',
        instructions: [
          'Open your web browser and navigate to https://design.penpot.app',
          'Log in to your Penpot account',
          'Complete any CloudFlare human verification challenges if prompted',
          'Once verified, try your request again',
        ],
      };
    } else if (e instanceof PenpotAPIError) {
      return {
        error: 'Penpot API Error',
        message: e.message,
        error_type: 'api_error',
        status_code: e.statusCode,
      };
    } else {
      return { error: e.message || String(e) };
    }
  }

  /**
   * Register all MCP handlers
   */
  private registerHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = [
        {
          uri: 'server://info',
          name: 'Server Information',
          description: 'Information about the Penpot MCP server',
          mimeType: 'application/json',
        },
      ];

      if (!config.RESOURCES_AS_TOOLS) {
        resources.push(
          {
            uri: 'penpot://schema',
            name: 'Penpot API Schema',
            description: 'The Penpot API schema as JSON',
            mimeType: 'application/schema+json',
          },
          {
            uri: 'penpot://tree-schema',
            name: 'Penpot Tree Schema',
            description: 'The Penpot object tree schema as JSON',
            mimeType: 'application/schema+json',
          },
          {
            uri: 'penpot://cached-files',
            name: 'Cached Files',
            description: 'List of all files currently stored in the cache',
            mimeType: 'application/json',
          }
        );
      }

      return { resources };
    });

    // Read a resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;

      if (uri === 'server://info') {
        const info: any = {
          status: 'online',
          name: 'Penpot MCP Server',
          description: 'Model Context Provider for Penpot',
          api_url: config.PENPOT_API_URL,
        };

        if (this.imageServer && this.imageServer.isRunning) {
          info.image_server = this.imageServerUrl;
        }

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      if (uri === 'penpot://schema') {
        const schemaPath = path.join(config.RESOURCES_PATH, 'penpot-schema.json');
        try {
          const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
          return {
            contents: [
              {
                uri,
                mimeType: 'application/schema+json',
                text: JSON.stringify(schema, null, 2),
              },
            ],
          };
        } catch (e: any) {
          throw new Error(`Failed to load schema: ${e.message}`);
        }
      }

      if (uri === 'penpot://tree-schema') {
        const schemaPath = path.join(config.RESOURCES_PATH, 'penpot-tree-schema.json');
        try {
          const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
          return {
            contents: [
              {
                uri,
                mimeType: 'application/schema+json',
                text: JSON.stringify(schema, null, 2),
              },
            ],
          };
        } catch (e: any) {
          throw new Error(`Failed to load tree schema: ${e.message}`);
        }
      }

      if (uri === 'penpot://cached-files') {
        const cachedFiles = this.fileCache.getAllCachedFiles();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(cachedFiles, null, 2),
            },
          ],
        };
      }

      if (uri.startsWith('rendered-component://')) {
        const componentId = uri.replace('rendered-component://', '');
        const image = this.renderedComponents.get(componentId);

        if (!image) {
          throw new Error(`Component with ID ${componentId} not found`);
        }

        return {
          contents: [
            {
              uri,
              mimeType: image.mimeType,
              blob: image.data,
            },
          ],
        };
      }

      throw new Error(`Unknown resource URI: ${uri}`);
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = [
        {
          name: 'list_projects',
          description: 'Retrieve a list of all available Penpot projects',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_project_files',
          description: 'Get all files contained within a specific Penpot project',
          inputSchema: {
            type: 'object',
            properties: {
              project_id: {
                type: 'string',
                description: 'The ID of the Penpot project',
              },
            },
            required: ['project_id'],
          },
        },
        {
          name: 'get_file',
          description:
            "Retrieve a Penpot file by its ID and cache it. Don't use this tool for code generation, use 'get_object_tree' instead.",
          inputSchema: {
            type: 'object',
            properties: {
              file_id: {
                type: 'string',
                description: 'The ID of the Penpot file',
              },
            },
            required: ['file_id'],
          },
        },
        {
          name: 'export_object',
          description: 'Export a Penpot design object as an image',
          inputSchema: {
            type: 'object',
            properties: {
              file_id: {
                type: 'string',
                description: 'The ID of the Penpot file',
              },
              page_id: {
                type: 'string',
                description: 'The ID of the page containing the object',
              },
              object_id: {
                type: 'string',
                description: 'The ID of the object to export',
              },
              export_type: {
                type: 'string',
                description: 'Image format (png, svg, etc.)',
                default: 'png',
              },
              scale: {
                type: 'number',
                description: 'Scale factor for the exported image',
                default: 1,
              },
            },
            required: ['file_id', 'page_id', 'object_id'],
          },
        },
        {
          name: 'get_object_tree',
          description:
            'Get the object tree structure for a Penpot object ("tree" field) with rendered screenshot image of the object ("image.mcp_uri" field)',
          inputSchema: {
            type: 'object',
            properties: {
              file_id: {
                type: 'string',
                description: 'The ID of the Penpot file',
              },
              object_id: {
                type: 'string',
                description: 'The ID of the object to retrieve',
              },
              fields: {
                type: 'array',
                items: { type: 'string' },
                description:
                  'Specific fields to include in the tree (call "penpot_tree_schema" resource/tool for available fields)',
              },
              depth: {
                type: 'number',
                description: 'How deep to traverse the object tree (-1 for full depth)',
                default: -1,
              },
              format: {
                type: 'string',
                description: "Output format ('json' or 'yaml')",
                default: 'json',
              },
            },
            required: ['file_id', 'object_id', 'fields'],
          },
        },
        {
          name: 'search_object',
          description: 'Search for objects within a Penpot file by name',
          inputSchema: {
            type: 'object',
            properties: {
              file_id: {
                type: 'string',
                description: 'The ID of the Penpot file to search in',
              },
              query: {
                type: 'string',
                description: 'Search string (supports regex patterns)',
              },
            },
            required: ['file_id', 'query'],
          },
        },
      ];

      // Add resource tools if RESOURCES_AS_TOOLS is enabled
      if (config.RESOURCES_AS_TOOLS) {
        tools.push(
          {
            name: 'penpot_schema',
            description: 'Provide the Penpot API schema as JSON',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'penpot_tree_schema',
            description: 'Provide the Penpot object tree schema as JSON',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_rendered_component',
            description: 'Return a rendered component image by its ID',
            inputSchema: {
              type: 'object',
              properties: {
                component_id: {
                  type: 'string',
                  description: 'The ID of the component',
                },
              },
              required: ['component_id'],
            } as any,
          },
          {
            name: 'get_cached_files',
            description: 'List all files currently stored in the cache',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          }
        );
      }

      return { tools };
    });

    // Call a tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      try {
        switch (name) {
          case 'list_projects':
            return await this.toolListProjects();

          case 'get_project_files':
            return await this.toolGetProjectFiles(args.project_id as string);

          case 'get_file':
            return await this.toolGetFile(args.file_id as string);

          case 'export_object':
            return await this.toolExportObject(
              args.file_id as string,
              args.page_id as string,
              args.object_id as string,
              (args.export_type as string) || 'png',
              (args.scale as number) || 1
            );

          case 'get_object_tree':
            return await this.toolGetObjectTree(
              args.file_id as string,
              args.object_id as string,
              args.fields as string[],
              (args.depth as number) ?? -1,
              (args.format as string) || 'json'
            );

          case 'search_object':
            return await this.toolSearchObject(args.file_id as string, args.query as string);

          case 'penpot_schema':
            return await this.toolPenpotSchema();

          case 'penpot_tree_schema':
            return await this.toolPenpotTreeSchema();

          case 'get_rendered_component':
            return await this.toolGetRenderedComponent((args as any).component_id as string);

          case 'get_cached_files':
            return await this.toolGetCachedFiles();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (e: any) {
        const errorResult = this.handleApiError(e);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResult, null, 2),
            },
          ],
        };
      }
    });
  }

  /**
   * Tool: list_projects
   */
  private async toolListProjects(): Promise<any> {
    try {
      const projects = await this.api.listProjects();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ projects }, null, 2),
          },
        ],
      };
    } catch (e: any) {
      const error = this.handleApiError(e);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(error, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Tool: get_project_files
   */
  private async toolGetProjectFiles(projectId: string): Promise<any> {
    try {
      const files = await this.api.getProjectFiles(projectId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ files }, null, 2),
          },
        ],
      };
    } catch (e: any) {
      const error = this.handleApiError(e);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(error, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Tool: get_file
   */
  private async toolGetFile(fileId: string): Promise<any> {
    try {
      const fileData = await this.api.getFile(fileId);
      this.fileCache.set(fileId, fileData);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(fileData, null, 2),
          },
        ],
      };
    } catch (e: any) {
      const error = this.handleApiError(e);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(error, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Tool: export_object
   */
  private async toolExportObject(
    fileId: string,
    pageId: string,
    objectId: string,
    exportType: string = 'png',
    scale: number = 1
  ): Promise<any> {
    let tempFilename: string | null = null;

    try {
      const tempDir = os.tmpdir();
      tempFilename = path.join(tempDir, `${objectId}.${exportType}`);

      const outputPath = await this.api.exportAndDownload(
        fileId,
        pageId,
        objectId,
        tempFilename,
        exportType,
        scale
      );

      const fileContent = fs.readFileSync(outputPath as string);
      const base64Data = fileContent.toString('base64');

      let mimeType = `image/${exportType}`;
      if (exportType === 'svg') {
        mimeType = 'image/svg+xml';
      }

      const image: MCPImage = {
        data: base64Data,
        mimeType,
      };

      // If HTTP server is enabled, add the image to the server
      if (this.imageServer && this.imageServer.isRunning) {
        const imageId = crypto
          .createHash('md5')
          .update(`${fileId}:${pageId}:${objectId}`)
          .digest('hex');
        const imageUrl = this.imageServer.addImage(imageId, fileContent, exportType);
        image.httpUrl = imageUrl;
      }

      // Return image as base64
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'Image exported successfully',
                format: exportType,
                httpUrl: image.httpUrl,
              },
              null,
              2
            ),
          },
          {
            type: 'image',
            data: base64Data,
            mimeType,
          },
        ],
      };
    } catch (e: any) {
      if (e instanceof CloudFlareError) {
        throw new Error(`CloudFlare Protection: ${e.message}`);
      } else {
        throw new Error(`Export failed: ${e.message}`);
      }
    } finally {
      if (tempFilename && fs.existsSync(tempFilename)) {
        try {
          fs.unlinkSync(tempFilename);
        } catch (e: any) {
          console.error(`Warning: Failed to delete temporary file ${tempFilename}: ${e.message}`);
        }
      }
    }
  }

  /**
   * Tool: get_object_tree
   */
  private async toolGetObjectTree(
    fileId: string,
    objectId: string,
    fields: string[],
    depth: number = -1,
    format: string = 'json'
  ): Promise<any> {
    try {
      const fileData = await this.getCachedFile(fileId);
      if ('error' in fileData) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(fileData, null, 2),
            },
          ],
        };
      }

      const result = getObjectSubtreeWithFields(fileData, objectId, fields, depth);

      if ('error' in result) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      const simplifiedTree = result.tree;
      const pageId = result.page_id;
      const finalResult: any = { tree: simplifiedTree };

      // Try to export the object image
      try {
        const tempDir = os.tmpdir();
        const tempFilename = path.join(tempDir, `${objectId}.png`);

        const outputPath = await this.api.exportAndDownload(fileId, pageId!, objectId, tempFilename);

        const fileContent = fs.readFileSync(outputPath as string);
        const base64Data = fileContent.toString('base64');

        const imageId = crypto.createHash('md5').update(`${fileId}:${objectId}`).digest('hex');

        this.renderedComponents.set(imageId, {
          data: base64Data,
          mimeType: 'image/png',
        });

        const imageUri = `rendered-component://${imageId}`;

        if (this.imageServer && this.imageServer.isRunning) {
          const httpUrl = this.imageServer.addImage(imageId, fileContent, 'png');
          finalResult.image = {
            uri: httpUrl,
            mcp_uri: imageUri,
            format: 'png',
          };
        } else {
          finalResult.image = {
            uri: imageUri,
            format: 'png',
          };
        }

        // Clean up temp file
        if (fs.existsSync(tempFilename)) {
          fs.unlinkSync(tempFilename);
        }
      } catch (e: any) {
        finalResult.image_error = e.message || String(e);
      }

      if (format.toLowerCase() === 'yaml') {
        // YAML support would require a library like js-yaml
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { format_error: 'YAML format not yet implemented in Node.js version' },
                null,
                2
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(finalResult, null, 2),
          },
        ],
      };
    } catch (e: any) {
      const error = this.handleApiError(e);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(error, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Tool: search_object
   */
  private async toolSearchObject(fileId: string, query: string): Promise<any> {
    try {
      const fileData = await this.getCachedFile(fileId);
      if ('error' in fileData) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(fileData, null, 2),
            },
          ],
        };
      }

      const pattern = new RegExp(query, 'i');
      const matches: any[] = [];

      const data = fileData.data || {};
      const pagesIndex = data.pagesIndex || {};

      for (const [pageId, pageData] of Object.entries(pagesIndex)) {
        const pageName = (pageData as any).name || 'Unnamed';
        const objects = (pageData as any).objects || {};

        for (const [objId, objData] of Object.entries(objects)) {
          const objName = (objData as any).name || '';
          if (pattern.test(objName)) {
            matches.push({
              id: objId,
              name: objName,
              page_id: pageId,
              page_name: pageName,
              object_type: (objData as any).type || 'unknown',
            });
          }
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ objects: matches }, null, 2),
          },
        ],
      };
    } catch (e: any) {
      const error = this.handleApiError(e);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(error, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Tool: penpot_schema
   */
  private async toolPenpotSchema(): Promise<any> {
    const schemaPath = path.join(config.RESOURCES_PATH, 'penpot-schema.json');
    try {
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(schema, null, 2),
          },
        ],
      };
    } catch (e: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: `Failed to load schema: ${e.message}` }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Tool: penpot_tree_schema
   */
  private async toolPenpotTreeSchema(): Promise<any> {
    const schemaPath = path.join(config.RESOURCES_PATH, 'penpot-tree-schema.json');
    try {
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(schema, null, 2),
          },
        ],
      };
    } catch (e: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: `Failed to load tree schema: ${e.message}` }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Tool: get_rendered_component
   */
  private async toolGetRenderedComponent(componentId: string): Promise<any> {
    const image = this.renderedComponents.get(componentId);
    if (!image) {
      throw new Error(`Component with ID ${componentId} not found`);
    }

    return {
      content: [
        {
          type: 'image',
          data: image.data,
          mimeType: image.mimeType,
        },
      ],
    };
  }

  /**
   * Tool: get_cached_files
   */
  private async toolGetCachedFiles(): Promise<any> {
    const cachedFiles = this.fileCache.getAllCachedFiles();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(cachedFiles, null, 2),
        },
      ],
    };
  }

  /**
   * Internal helper to retrieve a file, using cache if available
   */
  private async getCachedFile(fileId: string): Promise<any> {
    const cachedData = this.fileCache.get(fileId);
    if (cachedData !== null) {
      return cachedData;
    }

    try {
      const fileData = await this.api.getFile(fileId);
      this.fileCache.set(fileId, fileData);
      return fileData;
    } catch (e: any) {
      return this.handleApiError(e);
    }
  }

  /**
   * Run the MCP server
   */
  async run(): Promise<void> {
    console.log('Starting Penpot MCP Server...');

    // Start HTTP server if enabled and not already running
    if (config.ENABLE_HTTP_SERVER && this.imageServer && !this.imageServer.isRunning) {
      try {
        this.imageServerUrl = await this.imageServer.start();
      } catch (e: any) {
        console.error(`Warning: Failed to start image server: ${e.message}`);
      }
    }

    // Use stdio transport
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.log('Penpot MCP Server running');
  }
}

