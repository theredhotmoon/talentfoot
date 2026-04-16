<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toasts, removeToast } = useToast();

const getToastStyle = (type: string) => {
  switch (type) {
    case 'success':
      return 'background: var(--tf-gradient-primary); color: #0f0e17; box-shadow: 0 8px 32px rgba(16,185,129,0.4);';
    case 'error':
      return 'background: rgba(239,68,68,0.9); color: white; box-shadow: 0 8px 32px rgba(239,68,68,0.4);';
    case 'warning':
      return 'background: rgba(251,191,36,0.9); color: #0f0e17; box-shadow: 0 8px 32px rgba(251,191,36,0.4);';
    default:
      return 'background: var(--tf-bg-surface); color: var(--tf-text); box-shadow: 0 8px 32px rgba(0,0,0,0.4);';
  }
};

const getDefaultIcon = (type: string) => {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '⚠️';
    case 'warning': return '⚠️';
    default: return 'ℹ️';
  }
};
</script>

<template>
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 pointer-events-none">
    <transition-group name="toast-list">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="px-6 py-4 rounded-2xl text-center pointer-events-auto cursor-pointer"
        :style="getToastStyle(toast.type)"
        @click="removeToast(toast.id)"
      >
        <div class="text-3xl mb-1">{{ toast.icon || getDefaultIcon(toast.type) }}</div>
        <p class="font-heading font-bold">{{ toast.title }}</p>
        <p class="text-xs opacity-85">{{ toast.message }}</p>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-list-move,
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.3s ease;
}
.toast-list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.toast-list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.toast-list-leave-active {
  position: absolute;
}
</style>
