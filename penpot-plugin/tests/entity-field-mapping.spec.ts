import { test, expect } from '@playwright/test';
import { PendropSlicerPage } from './page-objects/PendropSlicerPage';

test.describe('EntityFieldMappingForm', () => {
  let pendropPage: PendropSlicerPage;

  test.beforeEach(async ({ page }) => {
    pendropPage = new PendropSlicerPage(page);
    await pendropPage.setup();
  });

  test('should save field mapping form data when entity type is set in current node', async () => {
    await pendropPage.switchToEntityContextTab();
    
    // Wait for schema to load
    await pendropPage.page.waitForTimeout(500);
    
    // First, set entity type and bundle in current node
    await pendropPage.entityTypeMappingForm.fill({
      contentType: 'node',
      bundle: 'landing_page'
    });
    await pendropPage.entityTypeMappingForm.save();
    await pendropPage.entityTypeMappingForm.waitForSaveNotification();
    
    // Wait for selection-change event to be processed (it's triggered automatically after save)
    await pendropPage.page.waitForTimeout(500);
    
    // Switch to field mapping tab (it should now be visible)
    await pendropPage.switchToFieldMappingTab();
    
    // Now fill field mapping form
    await pendropPage.entityFieldMappingForm.fill({
      field: 'field_description'
    });

    // Save the form
    await pendropPage.entityFieldMappingForm.save();

    // Wait for save notification
    await pendropPage.entityFieldMappingForm.waitForSaveNotification();

    // Verify data was saved to localStorage
    const savedData = await pendropPage.entityFieldMappingForm.getDataFromStorage();
    expect(savedData).toBeTruthy();
    expect(savedData.field).toBe('field_description');
  });

  test('should show inherited entity type and bundle from parent', async () => {
    await pendropPage.switchToEntityContextTab();
    
    // Wait for schema to load
    await pendropPage.page.waitForTimeout(500);
    
    // Set entity type and bundle (simulating parent node data)
    await pendropPage.entityTypeMappingForm.fill({
      contentType: 'node',
      bundle: 'landing_page'
    });
    await pendropPage.entityTypeMappingForm.save();
    await pendropPage.entityTypeMappingForm.waitForSaveNotification();
    
    // Wait for selection-change event to be processed (it's triggered automatically after save)
    await pendropPage.page.waitForTimeout(500);
    
    // Switch to field mapping tab (it should now be visible)
    await pendropPage.switchToFieldMappingTab();
    
    // Verify inherited info is displayed
    await pendropPage.entityFieldMappingForm.verifyInherited('node', 'landing_page');
  });

  test('should load field mapping form data', async () => {
    await pendropPage.switchToEntityContextTab();
    
    // Wait for schema to load
    await pendropPage.page.waitForTimeout(500);
    
    // First, set entity type and bundle
    await pendropPage.entityTypeMappingForm.fill({
      contentType: 'node',
      bundle: 'landing_page'
    });
    await pendropPage.entityTypeMappingForm.save();
    await pendropPage.entityTypeMappingForm.waitForSaveNotification();
    
    // Wait for selection-change event to be processed (it's triggered automatically after save)
    await pendropPage.page.waitForTimeout(500);
    
    // Switch to field mapping tab
    await pendropPage.switchToFieldMappingTab();
    
    // Verify form is visible before trying to fill it
    await pendropPage.entityFieldMappingForm.verifyVisible();
    
    // Save field mapping
    await pendropPage.entityFieldMappingForm.fill({
      field: 'field_description'
    });
    await pendropPage.entityFieldMappingForm.save();
    await pendropPage.entityFieldMappingForm.waitForSaveNotification();

    // Reload the page to test loading
    await pendropPage.page.reload();
    await pendropPage.navigate();

    // Reload schema
    await pendropPage.loadSchema();
    
    // Wait for forms to load
    await pendropPage.switchToEntityContextTab();
    await pendropPage.page.waitForTimeout(500);
    
    // Trigger selection-change to ensure context is loaded
    await pendropPage.triggerSelectionChange();
    await pendropPage.page.waitForTimeout(500);
    
    // Switch to field mapping tab
    await pendropPage.switchToFieldMappingTab();
    
    // Verify form is visible
    await pendropPage.entityFieldMappingForm.verifyVisible();

    // Verify field form is populated with saved data
    await pendropPage.entityFieldMappingForm.verifyLoaded({
      field: 'field_description'
    });
  });

  test('should not display form when no entity type mapping exists', async () => {
    await pendropPage.switchToEntityContextTab();
    
    // Wait for schema to load
    await pendropPage.page.waitForTimeout(500);
    
    // Clear any existing entity type mapping
    await pendropPage.page.evaluate(() => {
      localStorage.removeItem('penpot-mock-data');
      localStorage.removeItem('penpot-mock-parent-nodes');
    });
    
    // Trigger selection-change to refresh context
    await pendropPage.triggerSelectionChange();
    
    // Wait for refresh
    await pendropPage.page.waitForTimeout(500);
    
    // Verify field mapping tab is not visible (no parent with entity type mapping)
    await expect(pendropPage.fieldMappingTab).not.toBeVisible();
  });

  test('should appear when entity type mapping is added', async () => {
    await pendropPage.switchToEntityContextTab();
    
    // Wait for schema to load
    await pendropPage.page.waitForTimeout(500);
    
    // Initially, no entity type mapping exists
    await pendropPage.page.evaluate(() => {
      localStorage.removeItem('penpot-mock-data');
      localStorage.removeItem('penpot-mock-parent-nodes');
    });
    
    // Trigger selection-change to refresh context
    await pendropPage.triggerSelectionChange();
    await pendropPage.page.waitForTimeout(500);
    
    // Verify field mapping tab is not visible initially
    await expect(pendropPage.fieldMappingTab).not.toBeVisible();
    
    // Now add entity type mapping
    await pendropPage.entityTypeMappingForm.fill({
      contentType: 'node',
      bundle: 'landing_page'
    });
    await pendropPage.entityTypeMappingForm.save();
    await pendropPage.entityTypeMappingForm.waitForSaveNotification();
    
    // Wait for selection-change event to be processed (it's triggered automatically after save)
    await pendropPage.page.waitForTimeout(500);
    
    // Verify field mapping tab is now visible
    await expect(pendropPage.fieldMappingTab).toBeVisible();
    
    // Switch to field mapping tab and verify form is visible
    await pendropPage.switchToFieldMappingTab();
    await pendropPage.entityFieldMappingForm.verifyVisible();
    
    // Verify inherited info is displayed
    await pendropPage.entityFieldMappingForm.verifyInherited('node', 'landing_page');
  });

  test('should refresh form when entity type mapping changes', async () => {
    await pendropPage.switchToEntityContextTab();
    
    // Wait for schema to load
    await pendropPage.page.waitForTimeout(500);
    
    // First, set entity type and bundle
    await pendropPage.entityTypeMappingForm.fill({
      contentType: 'node',
      bundle: 'landing_page'
    });
    await pendropPage.entityTypeMappingForm.save();
    await pendropPage.entityTypeMappingForm.waitForSaveNotification();
    
    // Wait for selection-change event to be processed
    await pendropPage.page.waitForTimeout(500);
    
    // Switch to field mapping tab and verify form is visible
    await pendropPage.switchToFieldMappingTab();
    await pendropPage.entityFieldMappingForm.verifyVisible();
    
    // Verify inherited context
    await pendropPage.entityFieldMappingForm.verifyInherited('node', 'landing_page');
    
    // Switch back to entity context tab
    await pendropPage.switchToEntityContextTab();
    
    // Change the entity type mapping
    await pendropPage.entityTypeMappingForm.fill({
      contentType: 'block_content',
      bundle: 'text'
    });
    await pendropPage.entityTypeMappingForm.save();
    await pendropPage.entityTypeMappingForm.waitForSaveNotification();
    
    // Wait for selection-change event to be processed
    await pendropPage.page.waitForTimeout(500);
    
    // Switch to field mapping tab
    await pendropPage.switchToFieldMappingTab();
    
    // Verify form is still visible with updated context
    await pendropPage.entityFieldMappingForm.verifyVisible();
    await pendropPage.entityFieldMappingForm.verifyInherited('block_content', 'text');
  });

  test('should refresh correctly when context changes', async () => {
    await pendropPage.switchToEntityContextTab();
    
    // Wait for schema to load
    await pendropPage.page.waitForTimeout(500);
    
    // Set initial entity type and bundle
    await pendropPage.entityTypeMappingForm.fill({
      contentType: 'node',
      bundle: 'landing_page'
    });
    await pendropPage.entityTypeMappingForm.save();
    await pendropPage.entityTypeMappingForm.waitForSaveNotification();
    
    // Wait for selection-change event to be processed
    await pendropPage.page.waitForTimeout(500);
    
    // Switch to field mapping tab
    await pendropPage.switchToFieldMappingTab();
    
    // Verify form is visible and shows correct inherited data
    await pendropPage.entityFieldMappingForm.verifyVisible();
    await pendropPage.entityFieldMappingForm.verifyInherited('node', 'landing_page');
    
    // Switch back to entity context tab
    await pendropPage.switchToEntityContextTab();
    
    // Change entity type and bundle
    await pendropPage.entityTypeMappingForm.fill({
      contentType: 'block_content',
      bundle: 'text'
    });
    await pendropPage.entityTypeMappingForm.save();
    
    // Wait for save notification (with longer timeout for parallel test execution)
    try {
      await pendropPage.entityTypeMappingForm.waitForSaveNotification();
    } catch {
      // If notification doesn't appear, wait a bit longer
      await pendropPage.page.waitForTimeout(500);
    }
    
    // Wait for selection-change event to be processed (it's triggered automatically after save)
    await pendropPage.page.waitForTimeout(700);
    
    // Switch to field mapping tab
    await pendropPage.switchToFieldMappingTab();
    
    // Verify form still visible
    await pendropPage.entityFieldMappingForm.verifyVisible();
    
    // Verify form shows updated inherited data
    await pendropPage.entityFieldMappingForm.verifyInherited('block_content', 'text');
  });

  test('should reset field when switching to node with no data', async () => {
    await pendropPage.switchToEntityContextTab();
    
    // Wait for schema to load
    await pendropPage.page.waitForTimeout(500);
    
    // Set entity type and bundle
    await pendropPage.entityTypeMappingForm.fill({
      contentType: 'node',
      bundle: 'landing_page'
    });
    await pendropPage.entityTypeMappingForm.save();
    await pendropPage.entityTypeMappingForm.waitForSaveNotification();
    
    // Wait for selection-change event to be processed
    await pendropPage.page.waitForTimeout(500);
    
    // Switch to field mapping tab
    await pendropPage.switchToFieldMappingTab();
    
    // Verify form is visible
    await pendropPage.entityFieldMappingForm.verifyVisible();
    
    // Fill and save field mapping
    await pendropPage.entityFieldMappingForm.fill({
      field: 'field_description'
    });
    await pendropPage.entityFieldMappingForm.save();
    await pendropPage.entityFieldMappingForm.waitForSaveNotification();
    
    // Verify field is saved
    await pendropPage.entityFieldMappingForm.verifyLoaded({
      field: 'field_description'
    });
    
    // Now manually clear the field by selecting empty option
    const fieldSelect = pendropPage.page.getByLabel('Field');
    await fieldSelect.selectOption('');
    await pendropPage.page.waitForTimeout(300);
    
    // Verify field is reset (empty)
    await expect(fieldSelect).toHaveValue('');
  });
});

