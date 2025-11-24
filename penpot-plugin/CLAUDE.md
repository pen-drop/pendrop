# Claude AI Rules for Pendrop Penpot Plugin

## FormKit Schema Forms

**All forms must be implemented using FormKit Schema instead of Vue template syntax.**

Forms should be defined as FormKit Schema arrays in the component's `types.ts` file and rendered using the `<FormKitSchema>` component.

Reference: https://formkit.com/essentials/schema

### Schema Type Definition

Each form component must have a `FormSchema` type exported from its `types.ts` file:

```typescript
import type { FormKitSchema } from '../../../types/FormKitSchema.types';

export type FormSchema = FormKitSchema;
```

The `FormKitSchema` type is defined in `src/ui/types/FormKitSchema.types.ts` and should be imported from there. It re-exports `FormKitSchemaDefinition` from `@formkit/core`.

### Schema Implementation

1.  **Use a Context Object**: Bundle all form data and dynamic options into a single `computed` object.
2.  **Reference Data in Schema**: Use string references (starting with `$`) in the schema to access values from the context object. This avoids reactivity issues and unnecessary re-renders.

```typescript
// 1. Create a context object with data and options
const schemaContext = computed(() => ({
  ...formData.value,
  myOptions: options.value
}));

// 2. Define schema using string references ('$...')
const formSchema = computed<FormSchema>(() => [
  {
    $formkit: 'select',
    name: 'fieldName',
    label: 'Field Label',
    options: '$myOptions', // Reference the options from context
    validation: 'required',
    if: '$fieldName' // Conditional based on data
  }
]);
```

### Component Structure

Form components should:
1.  Define the `schemaContext` computed property.
2.  Define the `formSchema` computed property.
3.  Use `<FormKitSchema>` component to render the schema, passing `schemaContext` to the `:data` prop.
4.  Wrap everything in a `<FormKit type="form">` to handle submissions and state.

Example:
```vue
<script setup lang="ts">
import { computed } from 'vue';
import { FormKitSchema } from '@formkit/vue';
import type { FormSchema } from './FormName.types';

const formData = computed({ ... }); // getter/setter for modelValue
const options = computed(() => ...);

const schemaContext = computed(() => ({
  ...formData.value,
  options: options.value
}));

const formSchema = computed<FormSchema>(() => [...]);
</script>

<template>
  <FormKit type="form" v-model="formData" @submit="...">
    <FormKitSchema :schema="formSchema" :data="schemaContext" />
  </FormKit>
</template>
```

## Component Organization

**All components must follow this structure:**

- **Forms**: Place all form components in `src/ui/components/Forms/` folder
- **Tabs**: Place tab components in `src/ui/components/Tabs/` folder
- **Notification**: Place notification components in `src/ui/components/Notification/` folder
- **Each component folder**: Must contain its own `types.ts` file for type definitions
- **Component folders**: Should have an `index.ts` file for clean exports

## Vue Component Props

**Always use destructuring instead of `withDefaults` for Vue component props.**

Use this pattern:
```typescript
const props = defineProps<Props>();
const { propName = defaultValue } = props;
```

Instead of:
```typescript
const props = withDefaults(defineProps<Props>(), {
  propName: defaultValue
});
```

## Dynamic Component Loading

**When loading components dynamically, always use `markRaw` to prevent Vue reactivity warnings.**

```typescript
import { markRaw, defineAsyncComponent } from 'vue';

formComponents.value[form.id] = markRaw(defineAsyncComponent(() => 
  import(`./components/Forms/${form.component}/${form.component}.vue`)
));
```

## Language Rule

**All project documentation, code comments, commit messages, and communication must be in English.**

This includes:
- README files
- Documentation
- Code comments
- Commit messages
- Variable names (use English)
- Function names (use English)
- API documentation
- Error messages
- User-facing text
