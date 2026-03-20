<script setup lang="ts">
defineEmits<{ (e: 'close'): void }>();
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-card p-8 max-w-md text-center">
      <div class="text-5xl mb-4">🔒</div>
      <h3 class="font-heading text-xl font-bold mb-3" style="color: var(--tf-text);">{{ $t('challenges.sub_required_title') }}</h3>
      <p class="mb-6 text-sm" style="color: var(--tf-text-muted);">{{ $t('challenges.sub_required_message') }}</p>
      <button @click="$emit('close')" class="btn-primary">{{ $t('common.ok') }}</button>
    </div>
  </div>
</template>
