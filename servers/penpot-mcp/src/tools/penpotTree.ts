/**
 * Tool for building and visualizing the structure of Penpot files as a tree.
 */

/**
 * Find which page contains the specified object
 */
export function findPageContainingObject(content: any, objectId: string): string | null {
  // Helper function to recursively search for an object in the hierarchy
  function findObjectInHierarchy(objectsDict: Record<string, any>, targetId: string): boolean {
    // Check if the object is directly in the dictionary
    if (targetId in objectsDict) {
      return true;
    }

    // Check if the object is a child of any object in the dictionary
    for (const [_objId, objData] of Object.entries(objectsDict)) {
      // Look for objects that have shapes (children)
      if (objData.shapes && objData.shapes.includes(targetId)) {
        return true;
      }

      // Check in children elements if any
      if (objData.children) {
        const childObjects: Record<string, any> = {};
        for (const child of objData.children) {
          childObjects[child.id] = child;
        }
        if (findObjectInHierarchy(childObjects, targetId)) {
          return true;
        }
      }
    }

    return false;
  }

  // Check each page
  const pagesIndex = content.pagesIndex || {};
  for (const [pageId, pageData] of Object.entries(pagesIndex)) {
    const objectsDict = (pageData as any).objects || {};
    if (findObjectInHierarchy(objectsDict, objectId)) {
      return pageId;
    }
  }

  return null;
}

/**
 * Get a simplified tree representation of an object and its children
 */
export function getObjectSubtree(fileData: any, objectId: string): { tree?: any; page_id?: string; error?: string } {
  try {
    // Get the content from file data
    const content = fileData.data || fileData;

    // Find which page contains the object
    const pageId = findPageContainingObject(content, objectId);

    if (!pageId) {
      return { error: `Object ${objectId} not found in file` };
    }

    // This is a simplified version - in a full implementation, you would
    // build the complete tree structure similar to the Python version
    return {
      page_id: pageId,
      error: "Tree building not fully implemented in this version"
    };
  } catch (e: any) {
    return { error: e.message || String(e) };
  }
}

/**
 * Get a filtered tree representation of an object with only specified fields
 */
export function getObjectSubtreeWithFields(
  fileData: any,
  objectId: string,
  includeFields?: string[],
  depth: number = -1
): { tree?: any; page_id?: string; error?: string } {
  try {
    // Get the content from file data
    const content = fileData.data || fileData;

    // Find which page contains the object
    const pageId = findPageContainingObject(content, objectId);

    if (!pageId) {
      return { error: `Object ${objectId} not found in file` };
    }

    // Get the page data
    const pagesIndex = content.pagesIndex || {};
    const pageData = pagesIndex[pageId] || {};
    const objectsDict = pageData.objects || {};

    // Check if the object exists in this page
    if (!(objectId in objectsDict)) {
      return { error: `Object ${objectId} not found in page ${pageId}` };
    }

    // Track visited nodes to prevent infinite loops
    const visited = new Set<string>();

    // Function to recursively build the filtered object tree
    function buildFilteredObjectTree(objId: string, currentDepth: number = 0): any {
      if (!(objId in objectsDict)) {
        return null;
      }

      // Check for circular reference
      if (visited.has(objId)) {
        return {
          id: objId,
          name: objectsDict[objId].name || 'Unnamed',
          type: objectsDict[objId].type || 'unknown',
          _circular_reference: true
        };
      }

      // Mark this object as visited
      visited.add(objId);

      const objData = objectsDict[objId];

      // Create a new object with only the requested fields or all fields if None
      let filteredObj: any;
      if (!includeFields) {
        filteredObj = { ...objData };
      } else {
        filteredObj = {};
        for (const field of includeFields) {
          if (field in objData) {
            filteredObj[field] = objData[field];
          }
        }
      }

      // Always include the id field
      filteredObj.id = objId;

      // If depth limit reached, don't process children
      if (depth !== -1 && currentDepth >= depth) {
        visited.delete(objId);
        return filteredObj;
      }

      // Find all children of this object
      const children: any[] = [];
      for (const [childId, childData] of Object.entries(objectsDict)) {
        if ((childData as any).parentId === objId) {
          const childTree = buildFilteredObjectTree(childId, currentDepth + 1);
          if (childTree) {
            children.push(childTree);
          }
        }
      }

      // Add children field only if we have children
      if (children.length > 0) {
        filteredObj.children = children;
      }

      // Remove from visited after processing
      visited.delete(objId);

      return filteredObj;
    }

    // Build the filtered tree starting from the requested object
    const objectTree = buildFilteredObjectTree(objectId);

    if (!objectTree) {
      return { error: `Failed to build object tree for ${objectId}` };
    }

    return {
      tree: objectTree,
      page_id: pageId
    };
  } catch (e: any) {
    return { error: e.message || String(e) };
  }
}

