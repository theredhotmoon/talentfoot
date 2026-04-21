<template>
  <div class="auth-bg flex justify-center items-center min-h-screen">
    <div class="relative z-10 card-static p-8 w-full max-w-md mx-4 animate-fade-up" style="border-radius: var(--tf-radius-2xl);">
      <div class="text-center mb-8">
        <span class="text-3xl">⚽</span>
        <h1 class="font-heading font-extrabold text-2xl gradient-text mt-2">TalentFoot</h1>
        <p class="text-sm mt-1" style="color: var(--tf-text-muted);">{{ $t('forgot_password.title') }}</p>
      </div>

      <div v-if="success" class="text-center space-y-4">
        <div class="text-sm px-3 py-4 rounded-lg" style="color: #6ee7b7; background: rgba(16, 185, 129, 0.1);">
          {{ $t('forgot_password.success_message') }}
        </div>
        <router-link to="/login" class="btn-ghost w-full text-sm mt-4 inline-block">
          {{ $t('forgot_password.back_to_login') }}
        </router-link>
      </div>

      <form v-else @submit.prevent="handleForgotPassword" class="space-y-4">
        <div class="text-sm mb-4" style="color: var(--tf-text-dimmed);">
          {{ $t('forgot_password.description') }}
        </div>
        <input v-model="email" type="email" :placeholder="$t('forgot_password.email')" class="input-modern" required />
        <div v-if="error" class="text-sm px-3 py-2 rounded-lg" style="color: #f87171; background: rgba(239,68,68,0.1);">{{ error }}</div>
        
        <button type="submit" :disabled="loading" class="btn-primary w-full text-sm mt-2">
          {{ loading ? '...' : $t('forgot_password.submit') }}
        </button>

        <div class="text-center mt-6">
          <router-link to="/login" class="text-xs transition-colors" style="color: var(--tf-text-muted); hover:color: var(--tf-text);">
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
import api from '../api';

const { t } = useI18n();

const email = ref('');
const error = ref('');
const success = ref(false);
const loading = ref(false);

const handleForgotPassword = async (): Promise<void> => {
  loading.value = true;
  error.value = '';
  try {
    await api.post('/api/forgot-password', { email: email.value });
    success.value = true;
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } };
    error.value = err.response?.data?.message ?? t('forgot_password.error_generic');
  } finally {
    loading.value = false;
  }
};
</script>
