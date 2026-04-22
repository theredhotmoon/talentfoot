<script setup lang="ts">
defineProps<{
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}>();

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<template>
  <Teleport to="body">
    <div
      class="modal-overlay"
      @click.self="emit('cancel')"
      role="dialog"
      aria-modal="true"
      :aria-label="title || 'Confirm action'"
      aria-describedby="confirm-modal-message"
    >
      <div class="modal-card animate-fade-up" style="max-width: 420px;">
        <!-- Header -->
        <div class="px-6 py-4 flex justify-between items-center" style="border-bottom: 1px solid var(--tf-border);">
          <h2 class="text-lg font-heading font-bold" style="color: var(--tf-text);">
            {{ title || 'Confirm' }}
          </h2>
          <button
            type="button"
            @click="emit('cancel')"
            class="text-xl leading-none transition-colors hover:opacity-80 focus:outline-none"
            style="color: var(--tf-text-dimmed);"
            aria-label="Close"
          >&#times;</button>
        </div>

        <!-- Body -->
        <div class="px-6 py-5">
          <p id="confirm-modal-message" class="text-sm" style="color: var(--tf-text-muted);">{{ message }}</p>
        </div>

        <!-- Actions -->
        <div class="px-6 pb-5 flex justify-end gap-3">
          <button type="button" @click="emit('cancel')" class="btn-ghost">
            {{ cancelLabel || 'Cancel' }}
          </button>
          <button
            type="button"
            @click="emit('confirm')"
            :class="danger ? 'btn-danger' : 'btn-primary'"
          >
            {{ confirmLabel || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
