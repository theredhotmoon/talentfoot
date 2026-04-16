import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title: string;
  message: string;
  type: ToastType;
  icon?: string;
  duration?: number;
}

export interface Toast extends ToastOptions {
  id: string;
}

const toasts = ref<Toast[]>([]);

export function useToast() {
  const showToast = (options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = {
      ...options,
      id,
    };
    
    // Default duration is 5000ms unless specified
    const duration = options.duration ?? 5000;

    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  };

  return {
    toasts,
    showToast,
    removeToast,
  };
}
