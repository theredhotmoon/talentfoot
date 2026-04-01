<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
const auth = useAuthStore();
defineEmits<{ (e: 'close'): void }>();
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-card p-8 max-w-md text-center">
      <div class="text-5xl mb-4">🔒</div>
      <!-- Guest user -->
      <template v-if="!auth.isAuthenticated">
        <h3 class="font-heading text-xl font-bold mb-3" style="color: var(--tf-text);">{{ $t('auth.register_to_access_title') }}</h3>
        <p class="mb-6 text-sm" style="color: var(--tf-text-muted);">{{ $t('auth.register_to_access_desc') }}</p>
        <button class="btn-primary inline-block mb-3" @click="auth.showRegisterModal = true; $emit('close')">{{ $t('auth.register_now') }}</button>
        <br>
        <button @click="$emit('close')" class="btn-ghost text-sm">{{ $t('common.cancel') }}</button>
      </template>
      <!-- Logged-in, no subscription -->
      <template v-else>
        <h3 class="font-heading text-xl font-bold mb-3" style="color: var(--tf-text);">{{ $t('challenges.sub_required_title') }}</h3>
        <p class="mb-6 text-sm" style="color: var(--tf-text-muted);">{{ $t('challenges.sub_required_message') }}</p>
        <button @click="$emit('close')" class="btn-primary">{{ $t('common.ok') }}</button>
      </template>
    </div>
  </div>
</template>
