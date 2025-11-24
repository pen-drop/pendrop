# Claude AI Rules for Pendrop Project

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

Exceptions:
- Only when explicitly required by external APIs or third-party integrations that mandate a specific language
- Test data that requires specific language examples for testing purposes

## README Guidelines

**All README files must follow these rules:**

- **Be concise**: Keep READMEs brief and focused on essential information
- **No file/folder references**: Do not include references to specific files or folder structures
- **English only**: All READMEs must be written in English

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

## Component Organization

**All components must follow this structure:**

- **Forms**: Place all form components in `components/Forms/` folder
- **Tabs**: Place tab components in `components/Tabs/` folder
- **Notification**: Place notification components in `components/Notification/` folder
- **Each component folder**: Must contain its own `types.ts` file for type definitions
- **Component folders**: Should have an `index.ts` file for clean exports

Example structure:
```
components/
  Forms/
    EntityTypeMappingForm/
      EntityTypeMappingForm.vue
      EntityTypeMappingForm.types.ts
      index.ts
  Tabs/
    Tabs.vue
    TabItem.vue
    TabPanel.vue
    Tabs.types.ts
    TabItem.types.ts
    TabPanel.types.ts
    index.ts
  Notification/
    NotificationToast.vue
    Notification.types.ts
    index.ts
```

## Testing Guidelines (DRY Principle)

**All tests must follow the DRY (Don't Repeat Yourself) principle:**

- **Verify actual behavior**: Tests should verify that the expected behavior actually occurred, not just that no errors were thrown
- **Check saved data**: After saving, tests should verify that the data was actually saved to storage (e.g., using `getDataFromStorage()` or similar methods)
- **Use helper methods**: Create reusable helper methods in Page Objects for common verification patterns
- **Avoid redundant assertions**: If a helper method already verifies something, don't repeat the same assertion in the test

Example of good test practice:
```typescript
// Good: Verify data was actually saved
await form.fill(testData);
await form.save();
await form.waitForSaveNotification();

const savedData = await form.getDataFromStorage();
expect(savedData).toEqual(testData);

// Bad: Only check that save completed without errors
await form.fill(testData);
await form.save();
await form.waitForSaveNotification();
// Missing verification that data was actually saved!
```

## Project Context

Pendrop automates the creation of Drupal applications based on structure data and layout data from Penpot. Based on a uniform structure file, everything else is generated, tested, and updated via rule sets.

