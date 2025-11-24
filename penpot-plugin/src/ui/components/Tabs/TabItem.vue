<script setup lang="ts">
import { inject, computed } from 'vue';

const props = defineProps<{
  name: string;
  label: string;
}>();

const activeTab = inject<any>('activeTab');
const setActiveTab = inject<any>('setActiveTab');

const isActive = computed(() => activeTab?.value === props.name);

const handleClick = () => {
  setActiveTab?.(props.name);
};
</script>

<template>
  <button
    :class="['tab-item', { 'tab-item-active': isActive }]"
    :data-tab-name="name"
    @click="handleClick"
    type="button"
  >
    {{ label }}
  </button>
</template>

<style scoped>
.tab-item {
  padding: 0.375rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 400;
  color: #4a4a4a;
  transition: all 0.15s ease;
  position: relative;
  line-height: 1.5;
  text-transform: uppercase;
}

.tab-item:hover {
  color: rgba(255, 255, 255, 1);
}

.tab-item-active {
  color: #7efff5;
  background-color: #2e3434;
  font-weight: 500;
}

[data-theme="light"] .tab-item {
  color: #4a4a4a;
}

[data-theme="light"] .tab-item:hover {
  color: rgba(255, 255, 255, 1);
}

[data-theme="light"] .tab-item-active {
  color: #7efff5;
  background-color: #2e3434;
}
</style>
