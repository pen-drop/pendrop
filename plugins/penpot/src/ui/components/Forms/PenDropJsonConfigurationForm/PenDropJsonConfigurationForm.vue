<script setup lang="ts">
import { computed } from 'vue';
import { FormKitSchema } from '@formkit/vue';
import type { PenDropJsonConfigurationFormData, PenDropJsonConfigurationFormSchema } from './PenDropJsonConfigurationForm.types';

// Props
interface Props {
  modelValue: PenDropJsonConfigurationFormData | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: PenDropJsonConfigurationFormData];
  'save': [value: PenDropJsonConfigurationFormData];
}>();

// Computed form data that syncs with modelValue
// Converts between object (modelValue) and string (jsonSchema field)
const formData = computed({
  get: () => {
    const val = props.modelValue;
    const strVal = val 
      ? (typeof val === 'string' ? val : JSON.stringify(val, null, 2))
      : '';
    return { jsonSchema: strVal };
  },
  set: (values: Record<string, unknown>) => {
    const strVal = values.jsonSchema as string;
    try {
      const parsed = JSON.parse(strVal);
      emit('update:modelValue', parsed);
    } catch {
      emit('update:modelValue', strVal);
    }
  }
});

// Custom validation rule for JSON
const jsonValidation = (node: { value: string }) => {
  try {
    JSON.parse(node.value);
    return true;
  } catch {
    return false;
  }
};

// FormKit Schema definition
const formSchema = computed<PenDropJsonConfigurationFormSchema>(() => [
  {
    $el: 'div',
    attrs: { class: 'spacing-mb-2' },
    children: [
      {
        $formkit: 'textarea',
        name: 'jsonSchema',
        label: 'JSON Schema',
        validation: 'required|json',
        validationRules: { json: jsonValidation },
        validationMessages: {
          json: 'Please enter valid JSON.'
        },
        rows: 10
      }
    ]
  }
]);

const submitHandler = (data: Record<string, unknown>) => {
  try {
    const parsed = JSON.parse(data.jsonSchema as string);
    emit('save', parsed);
  } catch {
    console.error('Invalid JSON');
  }
};
</script>

<template>
  <FormKit
    type="form"
    v-model="formData"
    @submit="submitHandler"
    submit-label="Save Configuration"
    :submit-attrs="{ 'data-appearance': 'primary' }"
  >
    <FormKitSchema 
      :schema="formSchema as any" 
      />
  </FormKit>
</template>

<style scoped>
/* No custom CSS - using spacing.css utilities */
</style>
