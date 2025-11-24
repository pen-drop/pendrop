<script setup lang="ts">
import { inject, computed } from 'vue';

const props = defineProps<{
  name: string;
}>();

const activeTab = inject<any>('activeTab');

const isActive = computed(() => activeTab?.value === props.name);
</script>

<template>
  <div v-if="isActive" class="tab-panel">
    <slot></slot>
  </div>
</template>

<style scoped>
.tab-panel {
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
