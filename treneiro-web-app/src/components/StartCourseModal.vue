<script setup lang="ts">
defineProps<{ loading: boolean }>();
defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-card p-8 max-w-md text-center">
      <div class="text-5xl mb-4">⚡</div>
      <h3 class="font-heading text-xl font-bold mb-3" style="color: var(--tf-text);">{{ $t('course.start_title') }}</h3>
      <div class="text-left mb-6 text-sm space-y-2" style="color: var(--tf-text-muted);">
        <p>{{ $t('course.start_intro') }}</p>
        <ul class="space-y-1 text-xs pl-4">
          <li>1️⃣ {{ $t('course.start_step1') }}</li>
          <li>2️⃣ {{ $t('course.start_step2') }}</li>
          <li>3️⃣ {{ $t('course.start_step3') }}</li>
        </ul>
      </div>
      <div class="flex gap-3 justify-center">
        <button @click="$emit('cancel')" class="btn-ghost">{{ $t('common.cancel') }}</button>
        <button @click="$emit('confirm')" class="btn-primary" :disabled="loading">
          {{ loading ? '...' : $t('course.start_btn') }}
        </button>
      </div>
    </div>
  </div>
</template>
