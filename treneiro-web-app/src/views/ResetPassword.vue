<template>
  <div class="auth-bg flex justify-center items-center min-h-screen">
    <div class="relative z-10 card-static p-8 w-full max-w-md mx-4 animate-fade-up" style="border-radius: var(--tf-radius-2xl);">
      <div class="text-center mb-8">
        <span class="text-3xl">⚽</span>
        <h1 class="font-heading font-extrabold text-2xl gradient-text mt-2">TalentFoot</h1>
        <p class="text-sm mt-1" style="color: var(--tf-text-muted);">{{ $t('reset_password.title') }}</p>
      </div>

      <div v-if="success" class="text-center space-y-4">
        <div class="text-sm px-3 py-4 rounded-lg" style="color: #6ee7b7; background: rgba(16, 185, 129, 0.1);">
          {{ $t('reset_password.success_message') }}
        </div>
        <router-link to="/login" class="btn-primary w-full text-sm mt-4 inline-block">
          {{ $t('reset_password.login_now') }}
        </router-link>
      </div>

      <form v-else @submit.prevent="handleResetPassword" class="space-y-4">
        <input v-model="password" type="password" :placeholder="$t('reset_password.new_password')" class="input-modern" required />
        <input v-model="password_confirmation" type="password" :placeholder="$t('reset_password.confirm_password')" class="input-modern" required />
        
        <div v-if="error" class="text-sm px-3 py-2 rounded-lg" style="color: #f87171; background: rgba(239,68,68,0.1);">{{ error }}</div>
        
        <button type="submit" :disabled="loading" class="btn-primary w-full text-sm mt-2">
          {{ loading ? '...' : $t('reset_password.submit') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '../api';

const route = useRoute();
const { t } = useI18n();

const password = ref('');
const password_confirmation = ref('');
const error = ref('');
const success = ref(false);
const loading = ref(false);

const token = ref('');
const email = ref('');

onMounted(() => {
  if (route.query.token && route.query.email) {
    token.value = route.query.token as string;
    email.value = route.query.email as string;
  } else {
    error.value = t('reset_password.missing_token');
  }
});

const handleResetPassword = async (): Promise<void> => {
  if (!token.value || !email.value) return;

  loading.value = true;
  error.value = '';
  try {
    await api.post('/api/reset-password', {
      token: token.value,
      email: email.value,
      password: password.value,
      password_confirmation: password_confirmation.value
    });
    success.value = true;
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string, errors?: Record<string, string[]> } } };
    if (err.response?.data?.errors) {
      error.value = Object.values(err.response.data.errors).flat().join(', ');
    } else {
      error.value = err.response?.data?.message ?? t('reset_password.error_generic');
    }
  } finally {
    loading.value = false;
  }
};
</script>
