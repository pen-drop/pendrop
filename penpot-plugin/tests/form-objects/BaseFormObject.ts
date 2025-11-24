import { Page, Locator, expect } from '@playwright/test';

/**
 * Base class for all form objects
 * Provides common functionality like save, getDataFromStorage, etc.
 */
export abstract class BaseFormObject {
  readonly page: Page;
  
  /**
   * Unique form identifier (e.g. 'entity-mapping', 'json-configuration')
   */
  abstract readonly formId: string;
  
  /**
   * Locator for the save button
   */
  abstract readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Click save button and wait for save to complete
   */
  async save(): Promise<void> {
    await this.saveButton.click();
    // Wait for save to complete
    await this.page.waitForTimeout(200);
  }

  /**
   * Get form data from localStorage
   */
  async getDataFromStorage(): Promise<any> {
    return await this.page.evaluate((formId) => {
      const mockData = localStorage.getItem('penpot-mock-data');
      if (mockData) {
        const data = JSON.parse(mockData);
        // Use default board-id as tests run without specific board-id unless specified
        const urlParams = new URLSearchParams(window.location.search);
        const boardId = urlParams.get('board-id') || 'default';
        const key = `${boardId}:pendrop:${formId}`;
        
        const formData = data[key];
        return formData ? JSON.parse(formData) : null;
      }
      return null;
    }, this.formId);
  }

  /**
   * Wait for save notification to appear
   */
  async waitForSaveNotification(): Promise<void> {
    // Wait for "Saved!" notification
    await expect(this.page.getByText('Saved!')).toBeVisible({ timeout: 10000 });
    // Wait a bit more to ensure data is fully saved
    await this.page.waitForTimeout(200);
  }
}

