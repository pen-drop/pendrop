import { test, expect } from '@playwright/test';
import { PendropSlicerPage } from './page-objects/PendropSlicerPage';

test.describe('PenDropJsonConfigurationForm', () => {
  let pendropPage: PendropSlicerPage;

  test.beforeEach(async ({ page }) => {
    pendropPage = new PendropSlicerPage(page);
    await pendropPage.setup();
  });

  test('should save json configuration form data', async () => {
    await pendropPage.switchToConfigurationTab();
    
    const testJsonSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    };

    // Fill form with JSON schema
    await pendropPage.jsonConfigurationForm.fill(JSON.stringify(testJsonSchema, null, 2));

    // Save the form
    await pendropPage.jsonConfigurationForm.save();

    // Wait for save notification
    await pendropPage.jsonConfigurationForm.waitForSaveNotification();

    // Verify data was saved to localStorage
    const savedData = await pendropPage.jsonConfigurationForm.getDataFromStorage();
    expect(savedData).toBeTruthy();
    expect(savedData.type).toBe('object');
    expect(savedData.properties).toBeTruthy();
    expect(savedData.properties.name).toEqual({ type: 'string' });
    expect(savedData.properties.age).toEqual({ type: 'number' });
  });

  test('should load json configuration form data', async () => {
    await pendropPage.switchToConfigurationTab();
    
    const testJsonSchema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' }
      }
    };

    // First, save some data
    await pendropPage.jsonConfigurationForm.fill(JSON.stringify(testJsonSchema, null, 2));
    await pendropPage.jsonConfigurationForm.save();
    await pendropPage.jsonConfigurationForm.waitForSaveNotification();

    // Reload the page to test loading
    await pendropPage.page.reload();
    await pendropPage.navigate();

    // Wait for form to load
    await pendropPage.switchToConfigurationTab();
    await pendropPage.page.waitForTimeout(1000); // Wait for form to load from storage

    // Verify form is populated with saved data
    await pendropPage.jsonConfigurationForm.verifyLoaded(testJsonSchema);
  });

  test('should validate JSON before saving', async () => {
    await pendropPage.switchToConfigurationTab();
    
    // Get the current saved data (should be the schema)
    const initialData = await pendropPage.jsonConfigurationForm.getDataFromStorage();
    expect(initialData).toBeTruthy(); // Schema should be loaded
    
    // Try to save invalid JSON
    await pendropPage.jsonConfigurationForm.fillInvalidJson('{ invalid json }');
    
    // Try to save - FormKit should prevent submission with invalid JSON
    await pendropPage.jsonConfigurationForm.save();
    
    // Wait a bit to see if form submission was prevented
    await pendropPage.page.waitForTimeout(500);
    
    // Check that the data was NOT updated (should still be the schema, not the invalid JSON)
    const savedData = await pendropPage.jsonConfigurationForm.getDataFromStorage();
    // The data should still be the initial schema, not the invalid JSON
    expect(savedData).toBeTruthy();
    expect(savedData).toEqual(initialData); // Should still be the schema
  });
});

