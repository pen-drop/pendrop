<script setup lang="ts">
import { ref, provide } from 'vue';

const emit = defineEmits<{
  'tab-change': [tabName: string];
}>();

const activeTab = ref<string>('');

const setActiveTab = (tabName: string) => {
  activeTab.value = tabName;
  emit('tab-change', tabName);
};

// Provide activeTab and setActiveTab to children
provide('activeTab', activeTab);
provide('setActiveTab', setActiveTab);

// Set first tab as active on mount
defineExpose({ setActiveTab });
</script>

<template>
  <div class="tabs-wrapper">
    <div class="tabs-header">
      <slot name="tabs"></slot>
    </div>
    <div class="tabs-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.tabs-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.tabs-header {
  display: flex;
  gap: 0;
  border: 1px solid rgba(0, 0, 0, 1);
  border-radius: 0.375rem;
  padding: 2px;
  margin-top: 4px;
  margin-bottom: 1rem;
  background: rgba(0, 0, 0, 1);
}

[data-theme="light"] .tabs-header {
  border-color: rgba(0, 0, 0, 1);
  background: rgba(0, 0, 0, 1);
}

.tabs-content {
  flex: 1;
  padding-top: 0;
}
</style>
