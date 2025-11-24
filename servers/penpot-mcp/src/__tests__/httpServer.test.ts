/**
 * Tests for the HTTP server module.
 */

import { ImageServer } from '../utils/httpServer';
import axios from 'axios';

describe('ImageServer', () => {
  let server: ImageServer;

  beforeEach(() => {
    server = new ImageServer('localhost', 0);
  });

  afterEach(async () => {
    if (server.isRunning) {
      await server.stop();
    }
  });

  test('should initialize server', () => {
    expect(server).toBeDefined();
    expect(server.isRunning).toBe(false);
  });

  test('should start server', async () => {
    const baseUrl = await server.start();
    
    expect(server.isRunning).toBe(true);
    expect(baseUrl).toContain('http://localhost:');
    expect(server.url).toBe(baseUrl);
  });

  test('should stop server', async () => {
    await server.start();
    expect(server.isRunning).toBe(true);

    await server.stop();
    expect(server.isRunning).toBe(false);
  });

  test('should serve images', async () => {
    await server.start();
    
    const imageId = 'test-image-123';
    const imageData = Buffer.from('fake-image-data');
    const imageFormat = 'png';

    const imageUrl = server.addImage(imageId, imageData, imageFormat);
    expect(imageUrl).toContain(imageId);
    expect(imageUrl).toContain('.png');

    // Try to fetch the image
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('image/png');
    expect(Buffer.from(response.data).toString()).toBe('fake-image-data');
  });

  test('should return 404 for non-existent image', async () => {
    const baseUrl = await server.start();
    
    try {
      await axios.get(`${baseUrl}/images/nonexistent.png`);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response.status).toBe(404);
    }
  });

  test('should handle multiple images', async () => {
    await server.start();
    
    const image1 = Buffer.from('image1');
    const image2 = Buffer.from('image2');

    const url1 = server.addImage('img1', image1, 'png');
    const url2 = server.addImage('img2', image2, 'jpg');

    const response1 = await axios.get(url1, { responseType: 'arraybuffer' });
    const response2 = await axios.get(url2, { responseType: 'arraybuffer' });

    expect(Buffer.from(response1.data).toString()).toBe('image1');
    expect(Buffer.from(response2.data).toString()).toBe('image2');
  });

  test('should remove image', async () => {
    await server.start();
    
    const imageId = 'test-remove';
    const imageData = Buffer.from('remove-me');
    
    const imageUrl = server.addImage(imageId, imageData, 'png');
    
    // Image should be accessible
    const response1 = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    expect(response1.status).toBe(200);

    // Remove the image
    server.removeImage(imageId);

    // Image should no longer be accessible
    try {
      await axios.get(imageUrl);
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response.status).toBe(404);
    }
  });

  test('should handle health check', async () => {
    const url = await server.start();
    
    const response = await axios.get(`${url}/health`);
    
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ status: 'ok' });
  });
});

