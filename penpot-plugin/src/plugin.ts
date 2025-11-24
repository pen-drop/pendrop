/// <reference types="@penpot/plugin-types" />

// Initialize plugin
// Note: Mock system is only used in UI (main.ts), not in plugin context
// Tests navigate directly to UI, so plugin.ts always uses real Penpot API

// Penpot-Plugin-Initialisierung
penpot.ui.open("Pendrop Slicer", `src/ui/index.html?theme=${penpot.theme}`, {
  width: 320,
  height: 550,
});

penpot.on("themechange", (theme) => {
  penpot.ui.sendMessage({ type: "theme-change", theme });
});

// Form IDs that use node storage
// Note: These must be kept in sync with app.config.ts (forms with storageLocation: 'node')
// We can't import app.config.ts here because Vite would create code-splitting,
// and Penpot requires plugin.js to be a single standalone file without ES module imports
const NODE_STORAGE_FORM_IDS = ['entity-type-mapping', 'entity-field-mapping', 'view-configuration'] as const;

// Function to send selection-change message with parent nodes context
function sendSelectionChangeMessage() {
  const selection = penpot.selection;
  const hasSelection = selection.length > 0;
  
  if (!hasSelection) {
    penpot.ui.sendMessage({
      type: "selection-change",
      hasSelection: false,
      currentNodeId: null,
      parentNodes: []
    });
    return;
  }

  const currentNode = selection[0];
  const currentNodeId = currentNode.id;
  const parentNodes: Array<{ nodeId: string; data: Record<string, any> }> = [];

  // Traverse parent hierarchy and collect nodes with Pendrop data
  // Start from current node's parent
  let currentParent: any = currentNode.parent;
  const visitedNodeIds = new Set<string>();
  visitedNodeIds.add(currentNodeId);

  // Traverse up the hierarchy
  while (currentParent) {
    try {
      const parentId = currentParent.id;
      
      // Avoid infinite loops
      if (visitedNodeIds.has(parentId)) {
        break;
      }
      visitedNodeIds.add(parentId);

      // Collect all Pendrop form data from this parent node
      const nodeData: Record<string, any> = {};
      let hasPendropData = false;
      
      for (const formId of NODE_STORAGE_FORM_IDS) {
        const key = `pendrop:${formId}`;
        try {
          const formData = currentParent.getPluginData(key);
          if (formData) {
            try {
              nodeData[formId] = JSON.parse(formData);
              hasPendropData = true;
            } catch (e) {
              // Invalid JSON, skip
            }
          }
        } catch (e) {
          // Could not read plugin data, skip
        }
      }

      // Only include parent node if it has Pendrop data
      if (hasPendropData) {
        parentNodes.push({
          nodeId: parentId,
          data: nodeData
        });
      }

      // Move to next parent
      currentParent = currentParent.parent;
    } catch (e) {
      // Error accessing parent, stop traversal
      break;
    }
  }

  penpot.ui.sendMessage({
    type: "selection-change",
    hasSelection: true,
    currentNodeId: currentNodeId,
    parentNodes: parentNodes
  });
}

penpot.on("selectionchange", () => {
  sendSelectionChangeMessage();
});

penpot.ui.onMessage((message: any) => {
  if (message.type === "save-form") {
    // Generic form save handler
    // Supports saving to node (current selection) or file
    const storageLocation = message.storageLocation || 'node';
    const key = `pendrop:${message.formId}`;
    let saved = false;

    if (storageLocation === 'node') {
      // Save to current node if selection exists
      const selection = penpot.selection;
      if (selection.length > 0) {
        const node = selection[0];
        node.setPluginData(key, JSON.stringify(message.data));
        saved = true;
      }
    } else if (storageLocation === 'file' && penpot.currentFile) {
      // Save to file
      penpot.currentFile.setPluginData(key, JSON.stringify(message.data));
      saved = true;
    }

    if (saved) {
      penpot.ui.sendMessage({
        type: 'form-saved',
        formId: message.formId
      });
    }
  } else if (message.type === "load-form") {
    // Generic form load handler
    // Loads from node or file based on storageLocation
    const storageLocation = message.storageLocation || 'node';
    const key = `pendrop:${message.formId}`;
    let loadedData: string | null = null;

    if (storageLocation === 'node') {
      // Load from current node
      const selection = penpot.selection;
      if (selection.length > 0) {
        const node = selection[0];
        loadedData = node.getPluginData(key);
      }
    } else if (storageLocation === 'file' && penpot.currentFile) {
      // Load from file
      loadedData = penpot.currentFile.getPluginData(key);
    }

    if (loadedData) {
      penpot.ui.sendMessage({
        type: 'form-loaded',
        formId: message.formId,
        data: JSON.parse(loadedData)
      });
    } else {
      // Send empty response to indicate no data found
      penpot.ui.sendMessage({
        type: 'form-loaded',
        formId: message.formId,
        data: null
      });
    }
  } else if (message.type === "resize-window") {
    penpot.ui.resize(message.width, message.height);
  } else if (message.type === "ui-ready") {
    // UI is ready, send initial selection-change to populate parentNodesContext
    sendSelectionChangeMessage();
  }
});

