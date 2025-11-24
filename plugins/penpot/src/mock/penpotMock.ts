/**
 * Mock implementation of Penpot API for testing
 * Uses localStorage to simulate penpot.currentFile.setPluginData/getPluginData
 */

interface MockPluginData {
  [key: string]: string;
}

class PenpotMock {
  private storage: MockPluginData = {};
  private messageHandlers: Array<(message: any) => void> = [];

  /**
   * Initialize mock - loads data from localStorage
   */
  init() {
    // Load existing data from localStorage
    const stored = localStorage.getItem('penpot-mock-data');
    if (stored) {
      try {
        this.storage = JSON.parse(stored);
      } catch (e) {
        console.error('[MOCK] Failed to parse localStorage data:', e);
        this.storage = {};
      }
    } else {
      this.storage = {};
    }
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage() {
    localStorage.setItem('penpot-mock-data', JSON.stringify(this.storage));
  }

  /**
   * Mock penpot.currentFile.setPluginData
   */
  setPluginData(key: string, value: string) {
    this.storage[key] = value;
    this.saveToStorage();
  }

  /**
   * Mock penpot.currentFile.getPluginData
   */
  getPluginData(key: string): string | null {
    // Always reload from localStorage to ensure we have the latest data
    const stored = localStorage.getItem('penpot-mock-data');
    if (stored) {
      try {
        const storage = JSON.parse(stored);
        return storage[key] || null;
      } catch (e) {
        console.error('[MOCK] Failed to parse localStorage data:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Mock penpot.ui.sendMessage - sends message to iframe
   */
  sendMessage(message: any) {
    // In test mode, send message via postMessage
    // This simulates communication between plugin and UI
    window.postMessage(message, '*');
  }

  /**
   * Mock penpot.ui.onMessage - listens for messages from iframe
   */
  onMessage(handler: (message: any) => void) {
    this.messageHandlers.push(handler);
    
    // Listen for messages from iframe
    window.addEventListener('message', (event) => {
      // Only handle messages from same origin in test mode
      if (event.data && typeof event.data === 'object') {
        handler(event.data);
      }
    });
  }

  /**
   * Mock penpot.ui.open
   */
  open(title: string, url: string, options?: { width?: number; height?: number }) {
    // In test mode, we just log or handle differently
    console.log('[MOCK] penpot.ui.open', { title, url, options });
  }

  /**
   * Mock penpot.ui.resize
   */
  resize(width: number, height: number) {
    console.log('[MOCK] penpot.ui.resize', { width, height });
  }

  /**
   * Mock penpot.on for event listeners
   */
  on(event: string, _handler: (...args: any[]) => void) {
    console.log('[MOCK] penpot.on', event);
    // Store handlers for potential event simulation
    // In test mode, we might simulate events
  }

  /**
   * Mock penpot.selection
   */
  get selection() {
    return [];
  }

  /**
   * Mock penpot.theme
   */
  get theme() {
    return 'dark';
  }

  /**
   * Mock penpot.currentFile
   */
  get currentFile() {
    return {
      setPluginData: (key: string, value: string) => this.setPluginData(key, value),
      getPluginData: (key: string) => this.getPluginData(key),
    };
  }

  /**
   * Clear all mock data
   */
  clear() {
    this.storage = {};
    localStorage.removeItem('penpot-mock-data');
  }
}

// Export singleton instance
export const penpotMock = new PenpotMock();

// Initialize on import
penpotMock.init();

/**
 * Create a mock penpot object that can replace the real one
 */
export function createMockPenpot() {
  const mockPenpot = {
    ui: {
      open: penpotMock.open.bind(penpotMock),
      sendMessage: penpotMock.sendMessage.bind(penpotMock),
      onMessage: penpotMock.onMessage.bind(penpotMock),
      resize: penpotMock.resize.bind(penpotMock),
    },
    on: penpotMock.on.bind(penpotMock),
    get selection() {
      return penpotMock.selection;
    },
    get theme() {
      return penpotMock.theme;
    },
    get currentFile() {
      return penpotMock.currentFile;
    },
  };
  
  // Replace global penpot variable
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Mock Penpot API for testing
    window.penpot = mockPenpot;
    // Also set on globalThis for better compatibility
    // @ts-expect-error - Mock Penpot API for testing
    globalThis.penpot = mockPenpot;
  }
  
  return mockPenpot;
}

/**
 * Initialize mock globally - call this when test mode is detected
 */
export function initMockPenpot() {
  const mockPenpot = createMockPenpot();
  return mockPenpot;
}

