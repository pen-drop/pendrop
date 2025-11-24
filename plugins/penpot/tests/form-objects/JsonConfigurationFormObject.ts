import { Page, Locator, expect } from '@playwright/test';
import { BaseFormObject } from './BaseFormObject';

/**
 * Form Object for JSON Configuration Form
 */
export class JsonConfigurationFormObject extends BaseFormObject {
  readonly formId = 'json-configuration';
  
  readonly jsonSchemaTextarea: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    
    this.jsonSchemaTextarea = page.getByLabel('JSON Schema');
    this.saveButton = page.getByRole('button', { name: 'Save Configuration' });
  }

  /**
   * Fill the JSON configuration form with valid JSON
   */
  async fill(jsonSchema: string): Promise<void> {
    await this.jsonSchemaTextarea.fill(jsonSchema);
  }

  /**
   * Fill the form with invalid JSON (for validation tests)
   */
  async fillInvalidJson(invalidJson: string): Promise<void> {
    await this.jsonSchemaTextarea.fill(invalidJson);
  }

  /**
   * Verify that textarea is populated with expected JSON data
   */
  async verifyLoaded(expectedData: unknown): Promise<void> {
    const textareaValue = await this.jsonSchemaTextarea.inputValue();
    const loadedData = JSON.parse(textareaValue);
    expect(loadedData).toEqual(expectedData);
  }
}

