/**
 * HTTP server module for serving exported images from memory.
 */

import express, { Request, Response } from 'express';
import * as http from 'http';

/**
 * Image data structure
 */
interface ImageData {
  data: Buffer;
  format: string;
}

/**
 * Server for in-memory images.
 */
export class ImageServer {
  private host: string;
  private port: number;
  private app: express.Application;
  private server: http.Server | null;
  private isRunningFlag: boolean;
  private baseUrl: string | null;
  private images: Map<string, ImageData>;

  /**
   * Initialize the HTTP server.
   * @param host - Host address to listen on
   * @param port - Port to listen on (0 means use a random available port)
   */
  constructor(host: string = 'localhost', port: number = 0) {
    this.host = host;
    this.port = port;
    this.server = null;
    this.isRunningFlag = false;
    this.baseUrl = null;
    this.images = new Map();

    // Create Express app
    this.app = express();
    
    // Set up routes
    this.setupRoutes();
  }

  /**
   * Set up Express routes
   */
  private setupRoutes(): void {
    // Serve images
    this.app.get('/images/:imageId', (req: Request, res: Response) => {
      const imageId = req.params.imageId.split('.')[0]; // Remove extension if present
      
      const imageData = this.images.get(imageId);
      
      if (!imageData) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }

      // Set content type based on format
      let contentType = `image/${imageData.format}`;
      if (imageData.format === 'svg') {
        contentType = 'image/svg+xml';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', imageData.data.length);
      res.send(imageData.data);
    });

    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok' });
    });
  }

  /**
   * Start the HTTP server in a background thread.
   * @returns Base URL of the server with actual port used
   */
  async start(): Promise<string> {
    if (this.isRunningFlag) {
      return this.baseUrl!;
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.host, () => {
        if (!this.server) {
          reject(new Error('Failed to start server'));
          return;
        }

        const address = this.server.address();
        if (!address || typeof address === 'string') {
          reject(new Error('Invalid server address'));
          return;
        }

        this.port = address.port;
        this.baseUrl = `http://${this.host}:${this.port}`;
        this.isRunningFlag = true;

        console.log(`Image server started at ${this.baseUrl}`);
        resolve(this.baseUrl);
      });

      this.server.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Stop the HTTP server.
   */
  stop(): Promise<void> {
    if (!this.isRunningFlag || !this.server) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.server!.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        this.isRunningFlag = false;
        console.log('Image server stopped');
        resolve();
      });
    });
  }

  /**
   * Add image to in-memory storage.
   * @param imageId - Unique identifier for the image
   * @param imageData - Binary image data
   * @param imageFormat - Image format (png, jpg, etc.)
   * @returns URL to access the image
   */
  addImage(imageId: string, imageData: Buffer, imageFormat: string = 'png'): string {
    this.images.set(imageId, {
      data: imageData,
      format: imageFormat
    });
    
    return `${this.baseUrl}/images/${imageId}.${imageFormat}`;
  }

  /**
   * Remove image from in-memory storage.
   * @param imageId - Unique identifier for the image
   */
  removeImage(imageId: string): void {
    this.images.delete(imageId);
  }

  /**
   * Check if server is running
   */
  get isRunning(): boolean {
    return this.isRunningFlag;
  }

  /**
   * Get base URL
   */
  get url(): string | null {
    return this.baseUrl;
  }
}

