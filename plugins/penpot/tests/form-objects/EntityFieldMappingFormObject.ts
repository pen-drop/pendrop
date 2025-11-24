import { Page, Locator, expect } from '@playwright/test';
import { BaseFormObject } from './BaseFormObject';

/**
 * Form Object for Entity Field Mapping Form
 */
export class EntityFieldMappingFormObject extends BaseFormObject {
  readonly formId = 'entity-field-mapping';
  
  readonly fieldSelect: Locator;
  readonly saveButton: Locator;
  readonly inheritedInfo: Locator;

  constructor(page: Page) {
    super(page);
    
    this.fieldSelect = page.getByLabel('Field');
    this.saveButton = page.getByRole('button', { name: 'Save Field Mapping' });
    this.inheritedInfo = page.locator('text=Inherited from parent');
  }

  /**
   * Fill the entity field mapping form
   */
  async fill(data: {
    field: string;
  }): Promise<void> {
    // Wait for field select to be visible (requires inherited entity type and bundle)
    if (data.field) {
      await this.fieldSelect.waitFor({ state: 'visible' });
      await this.fieldSelect.selectOption(data.field);
    }
  }

  /**
   * Verify that form fields are populated with expected data
   */
  async verifyLoaded(expectedData: {
    field: string;
  }): Promise<void> {
    if (expectedData.field) {
      await this.fieldSelect.waitFor({ state: 'visible' });
      await expect(this.fieldSelect).toHaveValue(expectedData.field);
    }
  }

  /**
   * Verify that inherited entity type and bundle are displayed
   */
  async verifyInherited(entityType: string, bundle: string): Promise<void> {
    await expect(this.inheritedInfo).toContainText(entityType);
    await expect(this.inheritedInfo).toContainText(bundle);
  }

  /**
   * Verify that the form is visible (enabled)
   */
  async verifyVisible(): Promise<void> {
    await expect(this.saveButton).toBeVisible();
  }

  /**
   * Verify that the form is not visible (disabled)
   */
  async verifyNotVisible(): Promise<void> {
    await expect(this.saveButton).not.toBeVisible();
  }
}

