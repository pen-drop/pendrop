/**
 * Penpot API client for Node.js
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { PENPOT_API_URL, PENPOT_USERNAME, PENPOT_PASSWORD } from '../utils/config';

/**
 * Exception for CloudFlare protection errors
 */
export class CloudFlareError extends Error {
  statusCode?: number;
  responseText?: string;

  constructor(message: string, statusCode?: number, responseText?: string) {
    super(message);
    this.name = 'CloudFlareError';
    this.statusCode = statusCode;
    this.responseText = responseText;
  }
}

/**
 * General exception for Penpot API errors
 */
export class PenpotAPIError extends Error {
  statusCode?: number;
  responseText?: string;
  isCloudflare: boolean;

  constructor(message: string, statusCode?: number, responseText?: string, isCloudflare: boolean = false) {
    super(message);
    this.name = 'PenpotAPIError';
    this.statusCode = statusCode;
    this.responseText = responseText;
    this.isCloudflare = isCloudflare;
  }
}

/**
 * Penpot API client
 */
export class PenpotAPI {
  private baseUrl: string;
  private session: AxiosInstance;
  private accessToken: string | null;
  private debug: boolean;
  private email: string | undefined;
  private password: string | undefined;
  private profileId: string | null;

  constructor(baseUrl?: string, debug: boolean = false, email?: string, password?: string) {
    this.baseUrl = baseUrl || PENPOT_API_URL;
    this.accessToken = null;
    this.debug = debug;
    this.email = email || PENPOT_USERNAME;
    this.password = password || PENPOT_PASSWORD;
    this.profileId = null;

    // Create axios instance with default headers
    this.session = axios.create({
      headers: {
        'Accept': 'application/json, application/transit+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      withCredentials: true
    });
  }

  /**
   * Check if the response indicates a CloudFlare error
   */
  private isCloudflareError(response: AxiosResponse): boolean {
    const cloudflareIndicators = [
      'cloudflare',
      'cf-ray',
      'attention required',
      'checking your browser',
      'challenge',
      'ddos protection',
      'security check',
      'cf-browser-verification',
      'cf-challenge-running',
      'please wait while we are checking your browser',
      'enable cookies and reload the page',
      'this process is automatic'
    ];

    // Check response headers for CloudFlare
    const serverHeader = response.headers['server']?.toLowerCase() || '';
    const cfRay = response.headers['cf-ray'];

    if (serverHeader.includes('cloudflare') || cfRay) {
      return true;
    }

    // Check response content for CloudFlare indicators
    try {
      const responseText = typeof response.data === 'string' 
        ? response.data.toLowerCase() 
        : JSON.stringify(response.data).toLowerCase();
      
      for (const indicator of cloudflareIndicators) {
        if (responseText.includes(indicator)) {
          return true;
        }
      }
    } catch {
      // If we can't read the response text, don't assume it's CloudFlare
    }

    // Check for specific status codes that might indicate CloudFlare blocks
    if ([403, 429, 503].includes(response.status)) {
      try {
        const responseText = typeof response.data === 'string'
          ? response.data.toLowerCase()
          : JSON.stringify(response.data).toLowerCase();
        
        if (responseText.includes('cloudflare') || responseText.includes('cf-ray') || responseText.includes('attention required')) {
          return true;
        }
      } catch {
        // Ignore
      }
    }

    return false;
  }

  /**
   * Create a user-friendly CloudFlare error message
   */
  private createCloudflareErrorMessage(response: AxiosResponse): string {
    const baseMessage = 
      "CloudFlare protection has blocked this request. This is common on penpot.app. " +
      "To resolve this issue:\n\n" +
      "1. Open your web browser and navigate to https://design.penpot.app\n" +
      "2. Log in to your Penpot account\n" +
      "3. Complete any CloudFlare human verification challenges if prompted\n" +
      "4. Once verified, try your request again\n\n" +
      "The verification typically lasts for a period of time, after which you may need to repeat the process.";

    if (response.status) {
      return `${baseMessage}\n\nHTTP Status: ${response.status}`;
    }

    return baseMessage;
  }

  /**
   * Set the auth token for authentication
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    // For cookie-based auth, we'll handle cookies through axios
    this.session.defaults.headers['Authorization'] = `Token ${token}`;
  }

  /**
   * Login with email and password to get an auth token
   */
  async loginWithPassword(email?: string, password?: string): Promise<string> {
    const token = await this.loginForExport(email, password);
    this.setAccessToken(token);
    
    if (this.debug && this.profileId) {
      console.log(`\nProfile ID available: ${this.profileId}`);
    }
    
    return token;
  }

  /**
   * Get profile information for the current authenticated user
   */
  async getProfile(): Promise<any> {
    const url = `${this.baseUrl}/rpc/command/get-profile`;
    const payload = {};

    const response = await this.makeAuthenticatedRequest('post', url, payload, false);
    const data = response.data;
    const normalizedData = this.normalizeTransitResponse(data);

    if (this.debug) {
      console.log("\nProfile data retrieved:");
      console.log(JSON.stringify(normalizedData, null, 2).substring(0, 200) + "...");
    }

    // Store profile ID for later use
    if (normalizedData.id) {
      this.profileId = normalizedData.id;
      if (this.debug) {
        console.log(`\nStored profile ID: ${this.profileId}`);
      }
    }

    return normalizedData;
  }

  /**
   * Login for export operations (cookie-based authentication)
   */
  async loginForExport(email?: string, password?: string): Promise<string> {
    const loginEmail = email || this.email;
    const loginPassword = password || this.password;

    if (!loginEmail || !loginPassword) {
      throw new Error(
        "Email and password are required for export authentication. " +
        "Please provide them as parameters or set PENPOT_USERNAME and " +
        "PENPOT_PASSWORD environment variables."
      );
    }

    const url = `${this.baseUrl}/rpc/command/login-with-password`;

    // Use Transit+JSON format
    const payload = {
      "~:email": loginEmail,
      "~:password": loginPassword
    };

    if (this.debug) {
      console.log("\nLogin request payload (Transit+JSON format):");
      console.log(JSON.stringify({ ...payload, "~:password": "********" }, null, 2));
    }

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/transit+json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        withCredentials: true
      });

      if (this.debug && response.status !== 200) {
        console.log(`\nError response: ${response.status}`);
        console.log(`Response text: ${JSON.stringify(response.data)}`);
      }

      // Extract profile ID from response
      try {
        const data = response.data;
        if (Array.isArray(data)) {
          // Convert Transit array to dict
          const transitDict: Record<string, any> = {};
          let i = 1; // Skip the "^ " marker
          while (i < data.length - 1) {
            const key = data[i];
            const value = data[i + 1];
            transitDict[key] = value;
            i += 2;
          }

          // Extract profile ID
          if (transitDict["~:id"]) {
            let profileId = transitDict["~:id"];
            // Remove the ~u prefix for UUID
            if (typeof profileId === 'string' && profileId.startsWith("~u")) {
              profileId = profileId.substring(2);
            }
            this.profileId = profileId;
            if (this.debug) {
              console.log(`\nExtracted profile ID from login response: ${profileId}`);
            }
          }
        }
      } catch (e) {
        if (this.debug) {
          console.log(`\nCouldn't extract profile ID from response: ${e}`);
        }
      }

      // Extract auth token from cookies
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        if (this.debug) {
          console.log("\nSet-Cookie header found");
        }

        for (const cookie of cookies) {
          if (cookie.includes('auth-token=')) {
            const tokenMatch = cookie.match(/auth-token=([^;]+)/);
            if (tokenMatch) {
              const token = tokenMatch[1];
              if (this.debug) {
                console.log(`\nAuth token extracted from cookies: ${token.substring(0, 10)}...`);
              }
              // Store cookies in session
              this.session.defaults.headers['Cookie'] = cookie;
              return token;
            }
          }
        }

        throw new Error("Auth token not found in response cookies");
      } else {
        // Try to extract from response JSON if available
        const data = response.data;
        if (data['auth-token']) {
          return data['auth-token'];
        }

        throw new Error("Auth token not found in response cookies or JSON body");
      }
    } catch (error: any) {
      if (error.response && this.isCloudflareError(error.response)) {
        const message = this.createCloudflareErrorMessage(error.response);
        throw new CloudFlareError(message, error.response.status, JSON.stringify(error.response.data));
      }
      throw error;
    }
  }

  /**
   * Make an authenticated request, handling re-auth if needed
   */
  private async makeAuthenticatedRequest(
    method: 'get' | 'post',
    url: string,
    data?: any,
    useTransit: boolean = true,
    retryAuth: boolean = true
  ): Promise<AxiosResponse> {
    // If we don't have a token yet but have credentials, login first
    if (!this.accessToken && this.email && this.password) {
      if (this.debug) {
        console.log("\nNo access token set, logging in with credentials...");
      }
      await this.loginWithPassword();
    }

    // Set up headers
    const headers: Record<string, string> = {};

    if (useTransit) {
      headers['Content-Type'] = 'application/transit+json';
      headers['Accept'] = 'application/transit+json';

      // Convert payload to Transit+JSON format if present
      if (data) {
        // Only transform if not already in Transit format
        if (!Object.keys(data).some(k => k.startsWith('~:'))) {
          const transitPayload: Record<string, any> = {};

          // Add cmd if not present
          if (!data.cmd && !data['~:cmd']) {
            // Extract command from URL
            const cmd = url.split('/').pop();
            transitPayload['~:cmd'] = `~:${cmd}`;
          }

          // Convert standard JSON to Transit+JSON format
          for (const [key, value] of Object.entries(data)) {
            // Skip command if already added
            if (key === 'cmd') continue;

            const transitKey = key.startsWith('~:') ? key : `~:${key}`;

            // Handle special UUID conversion for IDs
            let transitValue = value;
            if (typeof value === 'string' && value.includes('-') && value.length > 30) {
              transitValue = `~u${value}`;
            }

            transitPayload[transitKey] = transitValue;
          }

          if (this.debug) {
            console.log("\nConverted payload to Transit+JSON format:");
            console.log(`Original: ${JSON.stringify(data)}`);
            console.log(`Transit: ${JSON.stringify(transitPayload)}`);
          }

          data = transitPayload;
        }
      }
    } else {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }

    // Ensure the Authorization header is set if we have a token
    if (this.accessToken) {
      headers['Authorization'] = `Token ${this.accessToken}`;
    }

    try {
      const response = await this.session.request({
        method,
        url,
        data,
        headers
      });

      if (this.debug) {
        console.log(`\nRequest to: ${url}`);
        console.log(`Method: ${method}`);
        console.log(`Headers: ${JSON.stringify(headers)}`);
        if (data) {
          console.log(`Payload: ${JSON.stringify(data, null, 2)}`);
        }
        console.log(`Response status: ${response.status}`);
      }

      return response;
    } catch (error: any) {
      // Check for CloudFlare errors first
      if (error.response && this.isCloudflareError(error.response)) {
        const message = this.createCloudflareErrorMessage(error.response);
        throw new CloudFlareError(message, error.response.status, JSON.stringify(error.response.data));
      }

      // Handle authentication errors
      if (error.response && [401, 403].includes(error.response.status) && this.email && this.password && retryAuth) {
        // Special case: don't retry auth for get-profile to avoid infinite loops
        if (url.endsWith('/get-profile')) {
          throw error;
        }

        if (this.debug) {
          console.log("\nAuthentication failed. Trying to re-login...");
        }

        // Re-login and update token
        await this.loginWithPassword();

        // Update headers with new token
        headers['Authorization'] = `Token ${this.accessToken}`;

        // Retry the request with the new token (but don't retry auth again)
        const response = await this.session.request({
          method,
          url,
          data,
          headers
        });

        return response;
      }

      throw error;
    }
  }

  /**
   * Normalize a Transit+JSON response to a more usable format
   */
  private normalizeTransitResponse(data: any): any {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      // Normalize dictionary
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        // Convert transit keywords in keys (~:key -> key)
        const normKey = typeof key === 'string' && key.startsWith('~:') 
          ? key.substring(2) 
          : key;
        // Recursively normalize values
        result[normKey] = this.normalizeTransitResponse(value);
      }
      return result;
    } else if (Array.isArray(data)) {
      // Normalize list items
      return data.map(item => this.normalizeTransitResponse(item));
    } else if (typeof data === 'string' && data.startsWith('~u')) {
      // Convert Transit UUIDs (~u123-456 -> 123-456)
      return data.substring(2);
    } else {
      // Return other types as-is
      return data;
    }
  }

  /**
   * List all available projects for the authenticated user
   */
  async listProjects(): Promise<any[]> {
    const url = `${this.baseUrl}/rpc/command/get-all-projects`;
    const payload = {};

    const response = await this.makeAuthenticatedRequest('post', url, payload, false);

    if (this.debug) {
      const contentType = response.headers['content-type'] || '';
      console.log(`\nResponse content type: ${contentType}`);
      console.log(`Response preview: ${JSON.stringify(response.data).substring(0, 100)}...`);
    }

    const data = response.data;

    if (this.debug) {
      console.log("\nData preview:");
      console.log(JSON.stringify(data, null, 2).substring(0, 200) + "...");
    }

    return data;
  }

  /**
   * Get details for a specific project
   */
  async getProject(projectId: string): Promise<any | null> {
    const projects = await this.listProjects();

    for (const project of projects) {
      if (project.id === projectId) {
        return project;
      }
    }

    return null;
  }

  /**
   * Get all files for a specific project
   */
  async getProjectFiles(projectId: string): Promise<any[]> {
    const url = `${this.baseUrl}/rpc/command/get-project-files`;
    const payload = { "project-id": projectId };

    const response = await this.makeAuthenticatedRequest('post', url, payload, false);
    return response.data;
  }

  /**
   * Get details for a specific file
   */
  async getFile(fileId: string, saveData: boolean = false, saveRawResponse: boolean = false): Promise<any> {
    const url = `${this.baseUrl}/rpc/command/get-file`;
    const payload = { id: fileId };

    const response = await this.makeAuthenticatedRequest('post', url, payload, false);

    // Save raw response if requested
    if (saveRawResponse) {
      const rawFilename = `${fileId}_raw_response.json`;
      fs.writeFileSync(rawFilename, JSON.stringify(response.data, null, 2));
      if (this.debug) {
        console.log(`\nSaved raw response to ${rawFilename}`);
      }
    }

    const data = response.data;

    // Save normalized data if requested
    if (saveData) {
      const filename = `${fileId}.json`;
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      if (this.debug) {
        console.log(`\nSaved file data to ${filename}`);
      }
    }

    return data;
  }

  /**
   * Create an export job for a Penpot object
   */
  async createExport(
    fileId: string,
    pageId: string,
    objectId: string,
    exportType: string = 'png',
    scale: number = 1,
    email?: string,
    password?: string,
    profileId?: string
  ): Promise<string> {
    // This uses the cookie auth approach, which requires login
    const token = await this.loginForExport(email, password);

    // If profile_id is not provided, get it from instance variable
    const useProfileId = profileId || this.profileId;

    if (!useProfileId) {
      throw new Error("Profile ID not available. It should be automatically extracted during login.");
    }

    const url = `${this.baseUrl}/export`;

    const payload = {
      "~:wait": true,
      "~:exports": [
        {
          "~:type": `~:${exportType}`,
          "~:suffix": "",
          "~:scale": scale,
          "~:page-id": `~u${pageId}`,
          "~:file-id": `~u${fileId}`,
          "~:name": "",
          "~:object-id": `~u${objectId}`
        }
      ],
      "~:profile-id": `~u${useProfileId}`,
      "~:cmd": "~:export-shapes"
    };

    if (this.debug) {
      console.log("\nCreating export with parameters:");
      console.log(JSON.stringify(payload, null, 2));
    }

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/transit+json',
          'Accept': 'application/transit+json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': `auth-token=${token}`
        },
        withCredentials: true
      });

      if (this.debug && response.status !== 200) {
        console.log(`\nError response: ${response.status}`);
        console.log(`Response text: ${JSON.stringify(response.data)}`);
      }

      const data = response.data;

      if (this.debug) {
        console.log("\nExport created successfully");
        console.log(`Response: ${JSON.stringify(data, null, 2)}`);
      }

      const resourceId = data["~:id"];
      if (!resourceId) {
        throw new Error("Resource ID not found in response");
      }

      return resourceId;
    } catch (error: any) {
      if (error.response && this.isCloudflareError(error.response)) {
        const message = this.createCloudflareErrorMessage(error.response);
        throw new CloudFlareError(message, error.response.status, JSON.stringify(error.response.data));
      }
      throw error;
    }
  }

  /**
   * Download an export resource by ID
   */
  async getExportResource(
    resourceId: string,
    saveToFile?: string,
    email?: string,
    password?: string
  ): Promise<Buffer | string> {
    const token = await this.loginForExport(email, password);

    const url = `${this.baseUrl}/export`;

    const payload = {
      "~:wait": false,
      "~:cmd": "~:get-resource",
      "~:id": resourceId
    };

    if (this.debug) {
      console.log(`\nFetching export resource: ${url}`);
    }

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/transit+json',
          'Accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': `auth-token=${token}`
        },
        responseType: 'arraybuffer',
        withCredentials: true
      });

      if (this.debug && response.status !== 200) {
        console.log(`\nError response: ${response.status}`);
        console.log(`Response headers: ${JSON.stringify(response.headers)}`);
      }

      const contentType = response.headers['content-type'] || '';

      if (this.debug) {
        console.log(`\nResource fetched successfully`);
        console.log(`Content-Type: ${contentType}`);
        console.log(`Content length: ${response.data.length} bytes`);
      }

      const content = Buffer.from(response.data);

      // Save to file if requested
      if (saveToFile) {
        let savePath = saveToFile;
        
        // If saveToFile is a directory, determine filename
        if (fs.existsSync(saveToFile) && fs.statSync(saveToFile).isDirectory()) {
          let filename = resourceId;
          
          // Try to get filename from Content-Disposition header
          const contentDisp = response.headers['content-disposition'] || '';
          if (contentDisp.includes('filename=')) {
            const match = contentDisp.match(/filename=["']?([^"';]+)["']?/);
            if (match) {
              filename = match[1];
            }
          } else {
            // Determine extension from content type
            const ext = contentType.split('/').pop()?.split(';')[0];
            if (ext && ['jpeg', 'png', 'pdf', 'svg+xml'].includes(ext)) {
              const extension = ext === 'svg+xml' ? 'svg' : ext;
              filename = `${resourceId}.${extension}`;
            }
          }
          
          savePath = path.join(saveToFile, filename);
        }

        // Ensure directory exists
        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(savePath, content);

        if (this.debug) {
          console.log(`\nSaved resource to ${savePath}`);
        }

        return savePath;
      }

      return content;
    } catch (error: any) {
      if (error.response && this.isCloudflareError(error.response)) {
        const message = this.createCloudflareErrorMessage(error.response);
        throw new CloudFlareError(message, error.response.status, JSON.stringify(error.response.data));
      }
      throw error;
    }
  }

  /**
   * Create and download an export in one step
   */
  async exportAndDownload(
    fileId: string,
    pageId: string,
    objectId: string,
    saveToFile?: string,
    exportType: string = 'png',
    scale: number = 1,
    email?: string,
    password?: string,
    profileId?: string
  ): Promise<Buffer | string> {
    // Create the export
    const resourceId = await this.createExport(
      fileId,
      pageId,
      objectId,
      exportType,
      scale,
      email,
      password,
      profileId
    );

    // Download the resource
    return await this.getExportResource(resourceId, saveToFile, email, password);
  }
}

