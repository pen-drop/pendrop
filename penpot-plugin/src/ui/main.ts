import { createApp } from 'vue';
import { plugin } from '@formkit/vue';
import '@formkit/themes/genesis';
import '@penpot/plugin-styles/styles.css';
import './css/spacing.css';
import App from './App.vue';
import { formkitConfig } from './formkit.config';

// Check for test mode and initialize mock if needed
const urlParams = new URLSearchParams(window.location.search);
const isTestMode = urlParams.get('testMode') === 'true';

if (isTestMode) {
  // Setup mock interceptors - wrap postMessage without modifying parent object
  // Store original in a closure to avoid modifying parent
  const originalPostMessage = parent.postMessage.bind(parent);
  
  // Access mock via localStorage
  const getStorageKey = (key: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('board-id') || 'default';
    return `${boardId}:${key}`;
  };

  const getMockStorage = () => {
    try {
      const stored = localStorage.getItem('penpot-mock-data');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };
  
  const setMockStorage = (key: string, value: string) => {
    const storage = getMockStorage();
    storage[getStorageKey(key)] = value;
    localStorage.setItem('penpot-mock-data', JSON.stringify(storage));
  };
  
  const getMockData = (key: string) => {
    const storage = getMockStorage();
    return storage[getStorageKey(key)] || null;
  };

  // Get mock parent nodes context (simulated hierarchy)
  const getMockParentNodesContext = () => {
    try {
      const stored = localStorage.getItem('penpot-mock-parent-nodes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Set mock parent nodes context
  const setMockParentNodesContext = (parentNodes: Array<{ nodeId: string; data: Record<string, any> }>) => {
    localStorage.setItem('penpot-mock-parent-nodes', JSON.stringify(parentNodes));
  };

  /**
   * Update parent nodes context by collecting all node-storage form data
   * Returns the updated parent nodes array
   */
  const updateParentNodesContext = (): Array<{ nodeId: string; data: Record<string, any> }> => {
    const parentNodes = getMockParentNodesContext();
    const nodeData: Record<string, any> = {};
    let hasPendropData = false;
    
    // Collect all node-storage form data from current node
    // In real plugin, this would come from config, but in mock we check all known forms
    const nodeStorageForms = ['entity-type-mapping', 'entity-field-mapping', 'view-configuration'];
    
    for (const formId of nodeStorageForms) {
      const formData = getMockData(`pendrop:${formId}`);
      if (formData) {
        try {
          nodeData[formId] = JSON.parse(formData);
          hasPendropData = true;
        } catch {
          // Invalid JSON, skip
        }
      }
    }
    
    if (hasPendropData) {
      // Check if current node is already in parentNodes
      const existingIndex = parentNodes.findIndex((node: any) => node.nodeId === 'current-node-id');
      
      if (existingIndex >= 0) {
        parentNodes[existingIndex].data = nodeData;
      } else {
        parentNodes.unshift({
          nodeId: 'current-node-id',
          data: nodeData
        });
      }
      setMockParentNodesContext(parentNodes);
    } else {
      // If no Pendrop data exists, ensure current node is not in parentNodes
      const filteredNodes = parentNodes.filter((node: any) => node.nodeId !== 'current-node-id');
      setMockParentNodesContext(filteredNodes);
      return filteredNodes;
    }
    
    return parentNodes;
  };

  /**
   * Send selection-change event with current parent nodes context
   * In mock mode, if current node has entity-type-mapping, include it in parentNodes
   * so that EntityFieldMappingForm can access it (simulates parent relationship)
   */
  const sendSelectionChangeEvent = (parentNodes: Array<{ nodeId: string; data: Record<string, any> }>) => {
    setTimeout(() => {
      // Create and dispatch a MessageEvent directly
      const event = new MessageEvent('message', {
        data: {
          type: 'selection-change',
          hasSelection: true,
          currentNodeId: 'current-node-id',
          parentNodes: parentNodes
        },
        origin: window.location.origin
      });
      window.dispatchEvent(event);
    }, 50); // Increased timeout to ensure UI is ready
  };
  
  // Create a wrapper function that doesn't modify parent
  const mockPostMessage = function(message: any, targetOrigin: string) {
    // Handle save-form
    if (message.type === 'save-form') {
      const key = `pendrop:${message.formId}`;
      setMockStorage(key, JSON.stringify(message.data));
      
      // If entity-type-mapping is saved, update parent nodes context for tests
      if (message.formId === 'entity-type-mapping') {
        const parentNodes = updateParentNodesContext();
        
        // Trigger selection-change event to update UI with new context
        // Use longer timeout to ensure form-saved event is processed first
        setTimeout(() => {
          sendSelectionChangeEvent(parentNodes);
        }, 150);
      }
      
      setTimeout(() => {
        window.postMessage({
          type: 'form-saved',
          formId: message.formId
        }, '*');
      }, 50);
      return;
    }
    
    // Handle load-form
    if (message.type === 'load-form') {
      const key = `pendrop:${message.formId}`;
      const savedData = getMockData(key);
      setTimeout(() => {
        window.postMessage({
          type: 'form-loaded',
          formId: message.formId,
          data: savedData ? JSON.parse(savedData) : null
        }, '*');
      }, 50);
      return;
    }
    
    // Handle selection-change - simulate parent nodes context
    if (message.type === 'selection-change') {
      // In test mode, simulate parent nodes context from localStorage
      // Tests can set up parent nodes via localStorage key 'penpot-mock-parent-nodes'
      // Always check current node for entity-type-mapping and update context
      // This ensures refresh works correctly even when no data exists initially
      const parentNodes = updateParentNodesContext();
      
      // Trigger selection-change event via MessageEvent
      sendSelectionChangeEvent(parentNodes);
      return;
    }
    
    // Handle ui-ready - send initial selection-change
    if (message.type === 'ui-ready') {
      const parentNodes = updateParentNodesContext();
      sendSelectionChangeEvent(parentNodes);
      return;
    }
    
    // For other messages, use original postMessage
    originalPostMessage(message, targetOrigin);
  };
  
  // Replace parent.postMessage using Object.defineProperty to avoid making parent non-extensible
  try {
    Object.defineProperty(parent, 'postMessage', {
      value: mockPostMessage,
      writable: true,
      configurable: true
    });
  } catch {
    // If we can't replace it, try direct assignment as fallback
    // @ts-expect-error - Mock postMessage for testing
    parent.postMessage = mockPostMessage;
  }
}

// Create Vue app
const app = createApp(App);
app.use(plugin, formkitConfig);
app.mount('#app');

