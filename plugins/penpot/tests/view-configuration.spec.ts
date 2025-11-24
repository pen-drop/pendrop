import { test, expect } from '@playwright/test';
import { PendropSlicerPage } from './page-objects/PendropSlicerPage';

test.describe('ViewConfigurationForm', () => {
  let pendropPage: PendropSlicerPage;

  test.beforeEach(async ({ page }) => {
    pendropPage = new PendropSlicerPage(page);
    await pendropPage.setup();
  });

  test('should save view configuration form data', async () => {
    await pendropPage.switchToViewsTab();
    
    // Wait for schema to load and select options to be available
    await pendropPage.page.waitForTimeout(500);
    
    const testData = {
      viewName: 'article_view',
      displayName: 'main'
    };

    // Fill form with view configuration
    await pendropPage.viewConfigurationForm.fill(testData);

    // Save the form
    await pendropPage.viewConfigurationForm.save();

    // Wait for save notification
    await pendropPage.viewConfigurationForm.waitForSaveNotification();

    // Verify data was saved to localStorage
    const savedData = await pendropPage.viewConfigurationForm.getDataFromStorage();
    expect(savedData).toBeTruthy();
    expect(savedData.viewName).toBe(testData.viewName);
    expect(savedData.displayName).toBe(testData.displayName);
  });

  test('should save view configuration without pager', async () => {
    await pendropPage.switchToViewsTab();
    
    // Wait for schema to load
    await pendropPage.page.waitForTimeout(500);
    
    // Use article_view from schema
    const testData = {
      viewName: 'article_view',
      displayName: 'main'
    };

    await pendropPage.viewConfigurationForm.fill(testData);
    await pendropPage.viewConfigurationForm.save();
    await pendropPage.viewConfigurationForm.waitForSaveNotification();

    const savedData = await pendropPage.viewConfigurationForm.getDataFromStorage();
    expect(savedData).toBeTruthy();
    expect(savedData.viewName).toBe(testData.viewName);
    expect(savedData.displayName).toBe(testData.displayName);
  });

  test('should load view configuration form data', async () => {
    await pendropPage.switchToViewsTab();
    
    // Wait for schema to load
    await pendropPage.page.waitForTimeout(500);
    
    const testData = {
      viewName: 'article_view',
      displayName: 'main'
    };

    // First, save some data
    await pendropPage.viewConfigurationForm.fill(testData);
    await pendropPage.viewConfigurationForm.save();
    await pendropPage.viewConfigurationForm.waitForSaveNotification();

    // Reload the page to test loading
    await pendropPage.page.reload();
    await pendropPage.navigate();

    // Reload schema
    await pendropPage.loadSchema();

    // Wait for form to load
    await pendropPage.switchToViewsTab();
    await pendropPage.page.waitForTimeout(1000); // Wait for form to load from storage

    // Verify form is populated with saved data
    await pendropPage.viewConfigurationForm.verifyLoaded(testData);
  });
});

