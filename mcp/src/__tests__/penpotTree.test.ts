/**
 * Tests for Penpot tree utilities.
 */

import {
  findPageContainingObject,
  getObjectSubtreeWithFields,
} from '../tools/penpotTree';

describe('Penpot Tree Utilities', () => {
  // Sample test data
  const sampleFileData = {
    data: {
      pagesIndex: {
        'page1': {
          name: 'Page 1',
          objects: {
            'obj1': {
              id: 'obj1',
              name: 'Root Frame',
              type: 'frame',
              parentId: null,
            },
            'obj2': {
              id: 'obj2',
              name: 'Child Rectangle',
              type: 'rect',
              parentId: 'obj1',
              x: 10,
              y: 20,
              width: 100,
              height: 50,
            },
            'obj3': {
              id: 'obj3',
              name: 'Nested Text',
              type: 'text',
              parentId: 'obj2',
              content: 'Hello World',
            },
          },
        },
        'page2': {
          name: 'Page 2',
          objects: {
            'obj4': {
              id: 'obj4',
              name: 'Another Frame',
              type: 'frame',
              parentId: null,
            },
          },
        },
      },
    },
  };

  describe('findPageContainingObject', () => {
    test('should find page containing object', () => {
      const pageId = findPageContainingObject(sampleFileData.data, 'obj1');
      expect(pageId).toBe('page1');
    });

    test('should find page for nested object', () => {
      const pageId = findPageContainingObject(sampleFileData.data, 'obj3');
      expect(pageId).toBe('page1');
    });

    test('should find page in different page', () => {
      const pageId = findPageContainingObject(sampleFileData.data, 'obj4');
      expect(pageId).toBe('page2');
    });

    test('should return null for non-existent object', () => {
      const pageId = findPageContainingObject(sampleFileData.data, 'nonexistent');
      expect(pageId).toBeNull();
    });

    test('should handle empty pages index', () => {
      const emptyData = { pagesIndex: {} };
      const pageId = findPageContainingObject(emptyData, 'obj1');
      expect(pageId).toBeNull();
    });
  });

  describe('getObjectSubtreeWithFields', () => {
    test('should get object subtree with all fields', () => {
      const result = getObjectSubtreeWithFields(sampleFileData, 'obj1');

      expect(result.error).toBeUndefined();
      expect(result.page_id).toBe('page1');
      expect(result.tree).toBeDefined();
      expect(result.tree?.id).toBe('obj1');
      expect(result.tree?.name).toBe('Root Frame');
      expect(result.tree?.type).toBe('frame');
    });

    test('should include children in tree', () => {
      const result = getObjectSubtreeWithFields(sampleFileData, 'obj1');

      expect(result.tree?.children).toBeDefined();
      expect(result.tree?.children?.length).toBeGreaterThan(0);
      
      const child = result.tree?.children?.[0];
      expect(child?.id).toBe('obj2');
      expect(child?.name).toBe('Child Rectangle');
    });

    test('should filter fields when specified', () => {
      const result = getObjectSubtreeWithFields(
        sampleFileData,
        'obj2',
        ['id', 'name', 'type']
      );

      expect(result.tree?.id).toBe('obj2');
      expect(result.tree?.name).toBe('Child Rectangle');
      expect(result.tree?.type).toBe('rect');
      
      // These fields should not be included
      expect(result.tree?.x).toBeUndefined();
      expect(result.tree?.y).toBeUndefined();
    });

    test('should respect depth limit', () => {
      const result = getObjectSubtreeWithFields(
        sampleFileData,
        'obj1',
        undefined,
        0
      );

      expect(result.tree?.id).toBe('obj1');
      // Children should not be included at depth 0
      expect(result.tree?.children).toBeUndefined();
    });

    test('should handle depth limit of 1', () => {
      const result = getObjectSubtreeWithFields(
        sampleFileData,
        'obj1',
        undefined,
        1
      );

      expect(result.tree?.id).toBe('obj1');
      expect(result.tree?.children).toBeDefined();
      expect(result.tree?.children?.length).toBeGreaterThan(0);
      
      // Grandchildren should not be included
      const child = result.tree?.children?.[0];
      expect(child?.children).toBeUndefined();
    });

    test('should return error for non-existent object', () => {
      const result = getObjectSubtreeWithFields(sampleFileData, 'nonexistent');

      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    });

    test('should handle object with no children', () => {
      const result = getObjectSubtreeWithFields(sampleFileData, 'obj4');

      expect(result.error).toBeUndefined();
      expect(result.tree?.id).toBe('obj4');
      expect(result.tree?.children).toBeUndefined();
    });

    test('should include specified fields for all levels', () => {
      const result = getObjectSubtreeWithFields(
        sampleFileData,
        'obj1',
        ['id', 'name', 'type']
      );

      expect(result.tree?.id).toBe('obj1');
      expect(result.tree?.name).toBe('Root Frame');
      
      if (result.tree?.children) {
        const child = result.tree.children[0];
        expect(child?.id).toBe('obj2');
        expect(child?.name).toBe('Child Rectangle');
        expect(child?.type).toBe('rect');
      }
    });

    test('should handle circular references gracefully', () => {
      const circularData = {
        data: {
          pagesIndex: {
            'page1': {
              name: 'Page 1',
              objects: {
                'obj1': {
                  id: 'obj1',
                  name: 'Object 1',
                  type: 'frame',
                  parentId: 'obj2', // Circular reference
                },
                'obj2': {
                  id: 'obj2',
                  name: 'Object 2',
                  type: 'frame',
                  parentId: 'obj1', // Circular reference
                },
              },
            },
          },
        },
      };

      const result = getObjectSubtreeWithFields(circularData, 'obj1');

      // Should complete without infinite loop
      expect(result.error).toBeUndefined();
      expect(result.tree).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    test('should handle empty file data', () => {
      const emptyData = { data: { pagesIndex: {} } };
      const result = getObjectSubtreeWithFields(emptyData, 'obj1');

      expect(result.error).toBeDefined();
    });

    test('should handle malformed data', () => {
      const malformedData = { data: {} };
      const result = getObjectSubtreeWithFields(malformedData, 'obj1');

      expect(result.error).toBeDefined();
    });

    test('should handle null parentId', () => {
      const result = getObjectSubtreeWithFields(sampleFileData, 'obj1');

      expect(result.tree?.parentId).toBeNull();
    });
  });
});

