import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { appConfig } from '../../app.config';
import type { FormDataMap, FormId, StorageLocation } from '../../app.config.types';
import type { ParentNode } from '../types/Context.types';
import type { PendropData } from '../types/PendropData.types';

/**
 * Central composable for managing all forms
 * Handles loading, saving, and state management for all forms defined in app.config.ts
 */
export function useForms() {
  // Initialize form data map dynamically from config
  const formDataMap = ref<FormDataMap>(
    Object.fromEntries(appConfig.forms.map(form => [form.id, null])) as FormDataMap
  );

  // Initialize loading and saving states dynamically from config
  const loadingStates = ref<Record<FormId, boolean>>(
    Object.fromEntries(appConfig.forms.map(form => [form.id, false])) as Record<FormId, boolean>
  );
  const savingStates = ref<Record<FormId, boolean>>(
    Object.fromEntries(appConfig.forms.map(form => [form.id, false])) as Record<FormId, boolean>
  );

  /**
   * Central storage method - load form data
   */
  const loadForm = (formId: FormId, storageLocation: StorageLocation) => {
    loadingStates.value[formId] = true;
    parent.postMessage({
      type: 'load-form',
      formId,
      storageLocation
    }, '*');
  };

  /**
   * Central storage method - save form data
   */
  const saveForm = (formId: FormId, data: FormDataMap[FormId], storageLocation: StorageLocation) => {
    savingStates.value[formId] = true;
    parent.postMessage({
      type: 'save-form',
      formId,
      storageLocation,
      data
    }, '*');
  };

  /**
   * Handle form-loaded event
   */
  const handleFormLoaded = (event: MessageEvent) => {
    const { type, formId, data } = event.data || {};
    if (type === 'form-loaded' && formId) {
      formDataMap.value[formId as FormId] = data ?? null;
      loadingStates.value[formId as FormId] = false;
    }
  };

  /**
   * Handle form-saved event
   */
  const handleFormSaved = (event: MessageEvent) => {
    const { type, formId } = event.data || {};
    if (type === 'form-saved' && formId) {
      savingStates.value[formId as FormId] = false;
    }
  };

  /**
   * Handle selection-change event
   * Reload data for node-storage forms when selection changes
   */
  const handleSelectionChange = () => {
    appConfig.forms
      .filter(form => form.storageLocation === 'node')
      .forEach(form => loadForm(form.id, form.storageLocation));
  };

  /**
   * Get props for a form using its configuration
   */
  const getFormProps = (formId: FormId, parentNodesContext: ParentNode[], schemaData?: PendropData | null) => {
    const config = appConfig.forms.find(f => f.id === formId);
    if (!config) {
      return { modelValue: null, enabled: false };
    }

    const formData = formDataMap.value[formId];
    const enabled = config.enabled(formData, parentNodesContext);
    const props = config.buildProps(formData, parentNodesContext, schemaData);

    return {
      ...props,
      enabled
    };
  };

  /**
   * Save form data using its configuration
   */
  const save = (formId: FormId, data: FormDataMap[FormId]) => {
    const config = appConfig.forms.find(f => f.id === formId);
    if (!config) {
      console.error(`Form config not found for: ${formId}`);
      return;
    }

    saveForm(formId, data, config.storageLocation);
  };

  /**
   * Update local form data directly (e.g. from user input)
   */
  const updateFormData = (formId: FormId, data: FormDataMap[FormId] | null) => {
    // TypeScript can't narrow the union type properly, so we use a type assertion
    (formDataMap.value as Record<FormId, FormDataMap[FormId] | null>)[formId] = data;
  };

  // Set up event listeners
  onMounted(() => {
    window.addEventListener('message', handleFormLoaded);
    window.addEventListener('message', handleFormSaved);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.addEventListener('penpot-selection-change', handleSelectionChange as any);

    // Load all forms on mount
    appConfig.forms.forEach(form => loadForm(form.id, form.storageLocation));
  });

  // Clean up event listeners
  onBeforeUnmount(() => {
    window.removeEventListener('message', handleFormLoaded);
    window.removeEventListener('message', handleFormSaved);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.removeEventListener('penpot-selection-change', handleSelectionChange as any);
  });

  return {
    formData: computed(() => formDataMap.value),
    loadingStates: computed(() => loadingStates.value),
    savingStates: computed(() => savingStates.value),
    save,
    getFormProps,
    updateFormData
  };
}

