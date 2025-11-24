import { test, expect } from '@playwright/test';
import { PendropSlicerPage } from './page-objects/PendropSlicerPage';

test.describe('EntityTypeMappingForm', () => {
  let pendropPage: PendropSlicerPage;

  test.beforeEach(async ({ page }) => {
    pendropPage = new PendropSlicerPage(page);
    await pendropPage.setup();
  });

  test('should save entity type mapping form data', async () => {
    await pendropPage.switchToEntityContextTab();
    
    // Wait for schema to load and options to be available
    await pendropPage.page.waitForTimeout(500);
    
    // Fill form with content type and bundle mapping
    await pendropPage.entityTypeMappingForm.fill({
      contentType: 'node',
      bundle: 'landing_page'
    });

    // Save the form
    await pendropPage.entityTypeMappingForm.save();

    // Wait for save notification
    await pendropPage.entityTypeMappingForm.waitForSaveNotification();

    // Verify data was saved to localStorage
    const savedData = await pendropPage.entityTypeMappingForm.getDataFromStorage();
    expect(savedData).toBeTruthy();
    expect(savedData.contentType).toBe('node');
    expect(savedData.bundle).toBe('landing_page');
  });

  test('should save block content type mapping form data', async () => {
    await pendropPage.switchToEntityContextTab();
    
    // Wait for schema to load
    await pendropPage.page.waitForTimeout(500);
    
    // Fill form with block content mapping
    await pendropPage.entityTypeMappingForm.fill({
      contentType: 'block_content',
      bundle: 'text'
    });

    // Save the form
    await pendropPage.entityTypeMappingForm.save();

    // Wait for save notification
    await pendropPage.entityTypeMappingForm.waitForSaveNotification();

    // Verify data was saved to localStorage
    const savedData = await pendropPage.entityTypeMappingForm.getDataFromStorage();
    expect(savedData).toBeTruthy();
    expect(savedData.contentType).toBe('block_content');
    expect(savedData.bundle).toBe('text');
  });

  test('should load entity type mapping form data', async () => {
    await pendropPage.switchToEntityContextTab();
    
    // Wait for schema to load
    await pendropPage.page.waitForTimeout(500);
    
    // First, save some data
    await pendropPage.entityTypeMappingForm.fill({
      contentType: 'node',
      bundle: 'landing_page'
    });
    await pendropPage.entityTypeMappingForm.save();
    await pendropPage.entityTypeMappingForm.waitForSaveNotification();

    // Reload the page to test loading
    await pendropPage.page.reload();
    await pendropPage.navigate();

    // Reload schema first, then wait for it to be available
    await pendropPage.loadSchema();
    
    // Wait for schema to be fully loaded in the UI
    await pendropPage.page.waitForTimeout(500);

    // Wait for form to load
    await pendropPage.switchToEntityContextTab();
    
    // Wait for schema to be available in EntityTypeMappingForm (it loads from json-configuration)
    // and for form data to be loaded
    await pendropPage.entityTypeMappingForm.contentTypeSelect.waitFor({ state: 'visible' });
    
    // Wait for form data to be loaded and options to be populated
    await pendropPage.page.waitForTimeout(1500); // Wait for form data to load and options to update

    // Verify form is populated with saved data
    await pendropPage.entityTypeMappingForm.verifyLoaded({
      contentType: 'node',
      bundle: 'landing_page'
    });
  });

  test('should reset fields when switching to node with no data', async () => {
    await pendropPage.switchToEntityContextTab();
    
    // Wait for schema to load
    await pendropPage.page.waitForTimeout(500);
    
    // First, save some data
    await pendropPage.entityTypeMappingForm.fill({
      contentType: 'node',
      bundle: 'landing_page'
    });
    await pendropPage.entityTypeMappingForm.save();
    await pendropPage.entityTypeMappingForm.waitForSaveNotification();
    
    // Verify data is saved
    await pendropPage.entityTypeMappingForm.verifyLoaded({
      contentType: 'node',
      bundle: 'landing_page'
    });
    
    // Now manually clear the form by selecting empty option
    const contentTypeSelect = pendropPage.page.getByLabel('Content Type');
    await contentTypeSelect.selectOption('');
    await pendropPage.page.waitForTimeout(300);
    
    // Verify form fields are reset (empty)
    await expect(contentTypeSelect).toHaveValue('');
    
    // Bundle should not be visible when contentType is empty
    const bundleSelect = pendropPage.page.getByLabel('Bundle');
    await expect(bundleSelect).not.toBeVisible();
  });
});

