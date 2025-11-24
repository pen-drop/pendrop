import { Page, Locator, expect } from '@playwright/test';
import { BaseFormObject } from './BaseFormObject';

/**
 * Form Object for Entity Type Mapping Form
 */
export class EntityTypeMappingFormObject extends BaseFormObject {
  readonly formId = 'entity-type-mapping';
  
  readonly contentTypeSelect: Locator;
  readonly bundleSelect: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    
    this.contentTypeSelect = page.getByLabel('Content Type');
    this.bundleSelect = page.getByLabel('Bundle');
    this.saveButton = page.getByRole('button', { name: 'Save Entity Type Mapping' });
  }

  /**
   * Fill the entity type mapping form
   */
  async fill(data: {
    contentType: string;
    bundle: string;
  }): Promise<void> {
    // Select content type
    await this.contentTypeSelect.selectOption(data.contentType);
    await this.page.waitForTimeout(200); // Wait for bundle options to load
    
    // Select bundle
    if (data.bundle) {
      await this.bundleSelect.waitFor({ state: 'visible' });
      await this.bundleSelect.selectOption(data.bundle);
    }
  }

  /**
   * Verify that form fields are populated with expected data
   */
  async verifyLoaded(expectedData: {
    contentType: string;
    bundle: string;
  }): Promise<void> {
    await expect(this.contentTypeSelect).toHaveValue(expectedData.contentType);
    
    if (expectedData.bundle) {
      await this.bundleSelect.waitFor({ state: 'visible' });
      await expect(this.bundleSelect).toHaveValue(expectedData.bundle);
    }
  }
}

