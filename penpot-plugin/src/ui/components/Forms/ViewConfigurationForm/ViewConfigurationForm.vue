<script setup lang="ts">
import { computed } from 'vue';
import { FormKitSchema } from '@formkit/vue';
import type { ViewConfigurationFormData, ViewConfigurationFormSchema } from './ViewConfigurationForm.types';

// Props
interface Props {
  modelValue: ViewConfigurationFormData | null;
  schemaData?: any; // JSON schema data for view options
}

const props = defineProps<Props>();
const { schemaData = null } = props;

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: ViewConfigurationFormData];
  'save': [value: ViewConfigurationFormData];
}>();

// Default form data
const defaultFormData = (): ViewConfigurationFormData => ({
  viewName: '',
  displayName: ''
});

// Computed form data that syncs directly with modelValue
const formData = computed({
  get: () => props.modelValue || defaultFormData(),
  set: (value: ViewConfigurationFormData | Record<string, any>) => {
    emit('update:modelValue', value as ViewConfigurationFormData);
  }
});

// Extract views from schema (new structure: config.views)
const views = computed(() => {
  return schemaData?.config?.views || {};
});

// View name options
const viewNameOptions = computed(() => {
  const options = [
    { label: 'Select View', value: '' }
  ];
  Object.keys(views.value).forEach(viewName => {
    options.push({ label: viewName, value: viewName });
  });
  return options;
});

// Display name options - in new structure, views don't have separate displays
// We'll use a single "main" display for now
const displayNameOptions = computed(() => {
  return [
    { label: 'Select Display', value: '' },
    { label: 'Main', value: 'main' }
  ];
});

// Context object for schema (combines data and dynamic options)
const schemaContext = computed(() => ({
  ...formData.value,
  viewNameOptions: viewNameOptions.value,
  displayNameOptions: displayNameOptions.value
}));

// FormKit Schema definition
const formSchema = computed<ViewConfigurationFormSchema>(() => [
  {
    $el: 'div',
    attrs: { class: 'spacing-mb-2' },
    children: [
      {
        $formkit: 'select',
        name: 'viewName',
        label: 'View Name',
        options: '$viewNameOptions',
        validation: 'required'
      },
      {
        $formkit: 'select',
        name: 'displayName',
        label: 'Display Name',
        options: '$displayNameOptions',
        validation: 'required',
        if: '$viewName'
      }
    ]
  }
]);

const submitHandler = (data: Record<string, any>) => {
  emit('save', data as ViewConfigurationFormData);
};
</script>

<template>
  <FormKit
    type="form"
    v-model="formData"
    @submit="submitHandler"
    submit-label="Save View Configuration"
    :submit-attrs="{ 'data-appearance': 'primary' }"
  >
    <FormKitSchema 
      :schema="formSchema as any" 
      :data="schemaContext"
      />
  </FormKit>
</template>

<style scoped>
/* No custom CSS - using spacing.css utilities */
</style>
