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
      <div class="text-5xl mb-4">🔒</div>
      <h3 class="font-heading text-xl font-bold mb-3" style="color: var(--tf-text);">
        {{ $t('course.start_challenge_modal_title') }}
      </h3>
      <p class="mb-6 text-sm" style="color: var(--tf-text-muted);">
        {{ $t('course.start_challenge_modal_desc') }}
      </p>
      <div class="flex gap-3 justify-center">
        <button @click="$emit('cancel')" class="btn-ghost">{{ $t('common.cancel') }}</button>
        <button @click="$emit('confirm')" class="btn-primary" :disabled="loading">
          {{ loading ? '...' : $t('course.start_challenge_now') }}
        </button>
      </div>
    </div>
  </div>
</template>
