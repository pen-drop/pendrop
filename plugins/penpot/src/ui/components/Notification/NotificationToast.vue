<script setup lang="ts">
import { watch, onBeforeUnmount, ref } from 'vue';

const props = defineProps<{
  show: boolean;
  message: string;
  duration?: number;
  type?: 'success' | 'error' | 'info' | 'warning';
}>();

const emit = defineEmits<{
  (e: 'hide'): void;
}>();

const timer = ref<number | null>(null);

const startTimer = () => {
  if (timer.value) {
    clearTimeout(timer.value);
    timer.value = null;
  }
  
  if (props.show && props.duration) {
    timer.value = window.setTimeout(() => {
      emit('hide');
    }, props.duration);
  }
};

watch(() => [props.show, props.message], () => {
  startTimer();
});

onBeforeUnmount(() => {
  if (timer.value) {
    clearTimeout(timer.value);
  }
});
</script>

<template>
  <Transition name="toast">
    <div 
      v-if="show" 
      :class="['notification-toast', `toast-${type || 'success'}`]"
    >
      {{ message }}
    </div>
  </Transition>
</template>

<style scoped>
.notification-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 12px 24px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  font-weight: 500;
  min-width: 200px;
  text-align: center;
}

.toast-success {
  background-color: #4caf50;
}

.toast-error {
  background-color: #f44336;
}

.toast-info {
  background-color: #2196f3;
}

.toast-warning {
  background-color: #ff9800;
}

.toast-enter-active {
  animation: slideUp 0.3s ease-out;
}

.toast-leave-active {
  animation: slideDown 0.3s ease-in;
}

@keyframes slideUp {
  from {
    bottom: 0;
    opacity: 0;
  }
  to {
    bottom: 20px;
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    bottom: 20px;
    opacity: 1;
  }
  to {
    bottom: 0;
    opacity: 0;
  }
}
</style>
