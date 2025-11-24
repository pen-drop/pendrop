<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { FormKitSchema } from '@formkit/vue';
import type { EntityTypeMappingFormData, EntityTypeMappingFormSchema } from './EntityTypeMappingForm.types';

// Props
interface Props {
  modelValue: EntityTypeMappingFormData | null;
  schemaData?: any; // JSON schema data for options
}

const props = defineProps<Props>();
const { schemaData = null } = props;

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: EntityTypeMappingFormData];
  'save': [value: EntityTypeMappingFormData];
}>();

// Use showForm to control visibility and force remount
const showForm = ref(true);

// Computed form data that syncs directly with modelValue
const formData = computed({
  get: () => (props.modelValue || { contentType: '', bundle: '' }) as Record<string, any>,
  set: (value: Record<string, any>) => {
    emit('update:modelValue', value as EntityTypeMappingFormData);
  }
});

// Watch for modelValue changes and force remount when transitioning from data to null
watch(() => props.modelValue, async (newValue, oldValue) => {
  // If transitioning from data to null, remount the form
  if (oldValue !== null && oldValue !== undefined && newValue === null) {
    showForm.value = false;
    await nextTick();
    showForm.value = true;
  }
});

// Content Type options (nodes, block_content, media, taxonomy)
const contentTypeOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = [
    { label: 'Select Content Type', value: '' }
  ];
  
  if (schemaData?.content) {
    const contentTypes = Object.keys(schemaData.content);
    contentTypes.forEach(type => {
      const label = type === 'node' ? 'Nodes' 
        : type === 'block_content' ? 'Block Content'
        : type === 'media' ? 'Media'
        : type === 'taxonomy' ? 'Taxonomy'
        : type;
      options.push({ label, value: type });
    });
  }
  
  return options;
});

// Bundle options based on selected content type
const bundleOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = [
    { label: 'Select Bundle', value: '' }
  ];
  
  if (formData.value.contentType && schemaData?.content?.[formData.value.contentType]) {
    const bundles = schemaData.content[formData.value.contentType];
    Object.keys(bundles).forEach(bundle => {
      options.push({ label: bundle, value: bundle });
    });
  }
  
  return options;
});

// Context object for schema (combines data and dynamic options)
const schemaContext = computed(() => ({
  ...formData.value,
  contentTypeOptions: contentTypeOptions.value,
  bundleOptions: bundleOptions.value
}));

// FormKit Schema definition
const formSchema = computed<EntityTypeMappingFormSchema>(() => [
  {
    $el: 'div',
    attrs: { class: 'spacing-mb-2' },
    children: [
      {
        $formkit: 'select',
        name: 'contentType',
        label: 'Content Type',
        options: '$contentTypeOptions',
        validation: 'required',
        on: {
          change: () => {
  formData.value = { ...formData.value, bundle: '' };
          }
        }
      },
      {
        $formkit: 'select',
        name: 'bundle',
        label: 'Bundle',
        options: '$bundleOptions',
        validation: 'required',
        if: '$contentType'
      }
    ]
  }
]);

const submitHandler = (data: Record<string, any>) => {
  emit('save', data as EntityTypeMappingFormData);
};
</script>

<template>
  <FormKit
    v-if="showForm"
    type="form"
    v-model="formData"
    @submit="submitHandler"
    submit-label="Save Entity Type Mapping"
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
