<template>
  <div class="auth-bg flex justify-center items-center min-h-screen">
    <div class="relative z-10 card-static p-8 w-full max-w-md mx-4 animate-fade-up" style="border-radius: var(--tf-radius-2xl);">
      <div class="text-center mb-8">
        <span class="text-3xl">⚽</span>
        <h1 class="font-heading font-extrabold text-2xl gradient-text mt-2">TalentFoot</h1>
        <p class="text-sm mt-1" style="color: var(--tf-text-muted);">{{ $t('forgot_password.title') }}</p>
      </div>

      <form @submit.prevent="handleForgotPassword" class="space-y-4">
        <div class="text-sm mb-4" style="color: var(--tf-text-dimmed);">
          {{ $t('forgot_password.description') }}
        </div>
        <input v-model="email" type="email" :placeholder="$t('forgot_password.email')" class="input-modern" required />

        <button type="submit" :disabled="loading" class="btn-primary w-full text-sm mt-2">
          {{ loading ? '...' : $t('forgot_password.submit') }}
        </button>

        <div class="text-center mt-6">
          <router-link to="/login" class="text-xs transition-colors" style="color: var(--tf-text-muted);">
            {{ $t('forgot_password.back_to_login') }}
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '../composables/useToast';
import api from '../api';

const { t } = useI18n();
const { showToast } = useToast();

const email = ref('');
const loading = ref(false);

const handleForgotPassword = async (): Promise<void> => {
  loading.value = true;
  try {
    await api.post('/api/forgot-password', { email: email.value });
    showToast({
      title: t('forgot_password.title'),
      message: t('forgot_password.success_message'),
      type: 'success',
      icon: '✉️',
      duration: 8000,
    });
    email.value = '';
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } };
    showToast({
      title: 'Error',
      message: err.response?.data?.message ?? t('forgot_password.error_generic'),
      type: 'error',
    });
  } finally {
    loading.value = false;
  }
};
</script>
