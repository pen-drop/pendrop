import { Page, Locator, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EntityTypeMappingFormObject } from '../form-objects/EntityTypeMappingFormObject';
import { EntityFieldMappingFormObject } from '../form-objects/EntityFieldMappingFormObject';
import { JsonConfigurationFormObject } from '../form-objects/JsonConfigurationFormObject';
import { ViewConfigurationFormObject } from '../form-objects/ViewConfigurationFormObject';

// Load schema once at module level
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const contentSchemaPath = join(__dirname, '..', 'penpot.data.content.json');
const dsSchemaPath = join(__dirname, '..', 'penpot.data.ds.json');
const contentData = JSON.parse(readFileSync(contentSchemaPath, 'utf-8'));
const dsData = JSON.parse(readFileSync(dsSchemaPath, 'utf-8'));
// Combine content and design system data
const schemaData = {
  ...contentData,
  ...dsData
};

/**
 * Page Object Model for Pendrop Slicer Plugin
 */
export class PendropSlicerPage {
  readonly page: Page;
  
  // Tabs
  readonly entityContextTab: Locator;
  readonly fieldMappingTab: Locator;
  readonly configurationTab: Locator;
  readonly viewsTab: Locator;
  
  // Form Objects
  readonly entityTypeMappingForm: EntityTypeMappingFormObject;
  readonly entityFieldMappingForm: EntityFieldMappingFormObject;
  readonly jsonConfigurationForm: JsonConfigurationFormObject;
  readonly viewConfigurationForm: ViewConfigurationFormObject;
  
  // Notifications
  readonly notificationToast: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Tabs - use data-tab-name attribute to select by tab ID
    this.entityContextTab = page.locator('button.tab-item[data-tab-name="entity-type-mapping"]');
    this.fieldMappingTab = page.locator('button.tab-item[data-tab-name="entity-field-mapping"]');
    this.configurationTab = page.locator('button.tab-item[data-tab-name="json-configuration"]');
    this.viewsTab = page.locator('button.tab-item[data-tab-name="view-configuration"]');
    
    // Form Objects
    this.entityTypeMappingForm = new EntityTypeMappingFormObject(page);
    this.entityFieldMappingForm = new EntityFieldMappingFormObject(page);
    this.jsonConfigurationForm = new JsonConfigurationFormObject(page);
    this.viewConfigurationForm = new ViewConfigurationFormObject(page);
    
    // Notifications
    this.notificationToast = page.locator('[data-testid="notification"]').or(page.locator('.notification'));
  }

  /**
   * Navigate to the plugin UI with test mode enabled
   */
  async navigate() {
    await this.page.goto('/src/ui/index.html?theme=dark&testMode=true');
    // Wait for the app to be mounted
    await this.page.waitForSelector('#app', { state: 'attached' });
    // Wait for tabs to be visible
    await this.entityContextTab.waitFor({ state: 'visible' });
  }

  /**
   * Common test setup: navigates, clears mock data, and loads schema
   */
  async setup() {
    await this.navigate();
    await this.clearMockData();
    await this.loadSchema();
  }

  /**
   * Switch to Entity Context tab (entity type mapping)
   */
  async switchToEntityContextTab() {
    await this.entityContextTab.click();
    await this.entityTypeMappingForm.contentTypeSelect.waitFor({ state: 'visible' });
  }

  /**
   * Switch to Field Mapping tab
   */
  async switchToFieldMappingTab() {
    await this.fieldMappingTab.click();
    await this.entityFieldMappingForm.fieldSelect.waitFor({ state: 'visible' });
  }

  /**
   * Switch to Configuration tab
   */
  async switchToConfigurationTab() {
    await this.configurationTab.click();
    await this.jsonConfigurationForm.jsonSchemaTextarea.waitFor({ state: 'visible' });
  }

  /**
   * Switch to Views tab
   */
  async switchToViewsTab() {
    await this.viewsTab.click();
    await this.viewConfigurationForm.viewNameSelect.waitFor({ state: 'visible' });
  }

  /**
   * @deprecated Use switchToEntityContextTab instead
   */
  async switchToMappingTab() {
    return this.switchToEntityContextTab();
  }

  /**
   * Clear all mock data from localStorage
   */
  async clearMockData() {
    await this.page.evaluate(() => {
      localStorage.removeItem('penpot-mock-data');
      localStorage.removeItem('penpot-mock-parent-nodes');
    });
  }

  /**
   * Trigger selection-change event to update parent nodes context
   */
  async triggerSelectionChange() {
    await this.page.evaluate(() => {
      // Trigger selection-change event via parent.postMessage (not window.postMessage)
      // This goes through the mock system which will populate parentNodes
      parent.postMessage({
        type: 'selection-change',
        hasSelection: true,
        currentNodeId: 'current-node-id',
        parentNodes: [] // Will be populated by mock system
      }, '*');
    });
    await this.page.waitForTimeout(200);
  }

  /**
   * Wait for notification to appear
   */
  async waitForNotification(message?: string) {
    if (message) {
      await expect(this.page.getByText(message)).toBeVisible();
    } else {
      // Wait for any notification
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Load schema as jsonConfigurationForm
   */
  async loadSchema(): Promise<void> {
    await this.switchToConfigurationTab();
    await this.jsonConfigurationForm.fill(JSON.stringify(schemaData, null, 2));
    await this.jsonConfigurationForm.save();
    await this.jsonConfigurationForm.waitForSaveNotification();
    // Wait a bit for the schema to be available
    await this.page.waitForTimeout(300);
  }

}

