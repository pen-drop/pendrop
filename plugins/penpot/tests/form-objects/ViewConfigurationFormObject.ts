import { Page, Locator, expect } from '@playwright/test';
import { BaseFormObject } from './BaseFormObject';

/**
 * Form Object for View Configuration Form
 */
export class ViewConfigurationFormObject extends BaseFormObject {
  readonly formId = 'view-configuration';
  
  readonly viewNameSelect: Locator;
  readonly displayNameSelect: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    
    this.viewNameSelect = page.getByLabel('View Name');
    this.displayNameSelect = page.getByLabel('Display Name');
    this.saveButton = page.getByRole('button', { name: 'Save View Configuration' });
  }

  /**
   * Fill the view configuration form
   */
  async fill(data: {
    viewName: string;
    displayName: string;
  }): Promise<void> {
    // View Name and Display Name are now selects
    // Wait for schema to load and options to be available
    await this.viewNameSelect.waitFor({ state: 'visible' });
    await this.viewNameSelect.selectOption(data.viewName);
    // Wait for display options to load after view selection
    await this.page.waitForTimeout(500);
    await this.displayNameSelect.waitFor({ state: 'visible' });
    await this.displayNameSelect.selectOption(data.displayName);
  }

  /**
   * Verify that form fields are populated with expected data
   */
  async verifyLoaded(expectedData: {
    viewName: string;
    displayName: string;
  }): Promise<void> {
    await expect(this.viewNameSelect).toHaveValue(expectedData.viewName);
    await expect(this.displayNameSelect).toHaveValue(expectedData.displayName);
  }
}

