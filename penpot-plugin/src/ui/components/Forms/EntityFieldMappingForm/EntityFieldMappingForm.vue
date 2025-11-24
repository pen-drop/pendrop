<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { FormKitSchema } from '@formkit/vue';
import type { EntityFieldMappingFormData, EntityFieldMappingFormSchema } from './EntityFieldMappingForm.types';

// Props
interface Props {
  modelValue: EntityFieldMappingFormData | null;
  inheritedEntityType?: string;
  inheritedBundle?: string;
  schemaData?: any; // JSON schema data for field options
}

const props = defineProps<Props>();
const { inheritedEntityType: inheritedEntityTypeProp, inheritedBundle: inheritedBundleProp, schemaData: schemaDataProp } = props;
const inheritedEntityType = computed(() => inheritedEntityTypeProp ?? '');
const inheritedBundle = computed(() => inheritedBundleProp ?? '');
const schemaData = computed(() => schemaDataProp ?? null);

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: EntityFieldMappingFormData];
  'save': [value: EntityFieldMappingFormData];
}>();

// Use showForm to control visibility and force remount
const showForm = ref(true);

// Computed form data that syncs directly with modelValue
const formData = computed({
  get: () => (props.modelValue || { field: '' }) as Record<string, any>,
  set: (value: Record<string, any>) => {
    emit('update:modelValue', value as EntityFieldMappingFormData);
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

// Field options based on inherited entity type and bundle
const fieldOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = [
    { label: 'Select Field', value: '' }
  ];
  
  if (inheritedEntityType.value && inheritedBundle.value && schemaData.value?.content?.[inheritedEntityType.value]?.[inheritedBundle.value]?.fields) {
    const fields = schemaData.value.content[inheritedEntityType.value][inheritedBundle.value].fields;
    Object.keys(fields).forEach(field => {
      // Skip system fields like id, uuid, type, status, etc.
      if (!['id', 'uuid', 'type', 'status', 'created', 'changed', 'langcode'].includes(field)) {
        const fieldData = fields[field];
        const title = fieldData.title || field;
        options.push({ label: title, value: field });
      }
    });
  }
  
  return options;
});

// Context object for schema (combines data and dynamic options)
const schemaContext = computed(() => ({
  ...formData.value,
  inheritedEntityType: inheritedEntityType.value,
  inheritedBundle: inheritedBundle.value,
  fieldOptions: fieldOptions.value
}));

// FormKit Schema definition
const formSchema = computed<EntityFieldMappingFormSchema>(() => [
  {
    $el: 'div',
    attrs: { class: 'spacing-mb-2' },
    children: [
      {
        $el: 'div',
        if: '$inheritedEntityType && $inheritedBundle',
        attrs: { 
          style: 'margin-bottom: 1rem; padding: 0.5rem; background: var(--color-bg-secondary); border-radius: 4px;'
        },
        children: [
          {
            $el: 'div',
            attrs: { 
              style: 'font-size: 0.875rem; color: var(--color-text-secondary);'
            },
            children: [
              'Inherited from parent: ',
              { $el: 'strong', children: '$inheritedEntityType' },
              ' / ',
              { $el: 'strong', children: '$inheritedBundle' }
            ]
          }
        ]
      },
      {
        $formkit: 'select',
        name: 'field',
        label: 'Field',
        options: '$fieldOptions',
        validation: 'required',
        if: '$inheritedEntityType && $inheritedBundle',
        attrs: {
          disabled: '!$inheritedEntityType || !$inheritedBundle'
        }
      }
    ]
  }
]);

const submitHandler = (data: Record<string, any>) => {
  emit('save', data as EntityFieldMappingFormData);
};
</script>

<template>
    <FormKit
      v-if="showForm"
      type="form"
      v-model="formData"
      @submit="submitHandler"
      submit-label="Save Field Mapping"
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
