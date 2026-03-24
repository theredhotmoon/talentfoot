<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t } = useI18n();

const handleBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/');
    }
};
</script>

<template>
  <button @click="handleBack" class="btn-ghost flex items-center gap-2 group transition-all duration-300">
    <div class="h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 shadow-sm transition-colors duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
    </div>
    <span class="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
      {{ t('nav.back') || 'Back' }}
    </span>
  </button>
</template>
