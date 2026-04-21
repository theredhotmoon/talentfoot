<template>
  <div class="auth-bg flex justify-center items-center min-h-screen">
    <div class="relative z-10 card-static p-8 w-full max-w-md mx-4 animate-fade-up" style="border-radius: var(--tf-radius-2xl);">
      <div class="text-center mb-8">
        <span class="text-3xl">⚽</span>
        <h1 class="font-heading font-extrabold text-2xl gradient-text mt-2">TalentFoot</h1>
        <p class="text-sm mt-1" style="color: var(--tf-text-muted);">{{ $t('reset_password.title') }}</p>
      </div>

      <form @submit.prevent="handleResetPassword" class="space-y-4">
        <input v-model="password" type="password" :placeholder="$t('reset_password.new_password')" class="input-modern" required />
        <input v-model="password_confirmation" type="password" :placeholder="$t('reset_password.confirm_password')" class="input-modern" required />

        <button type="submit" :disabled="loading || !token" class="btn-primary w-full text-sm mt-2">
          {{ loading ? '...' : $t('reset_password.submit') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from '../composables/useToast';
import api from '../api';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { showToast } = useToast();

const password = ref('');
const password_confirmation = ref('');
const loading = ref(false);

const token = ref('');
const email = ref('');

onMounted(() => {
  if (route.query.token && route.query.email) {
    token.value = route.query.token as string;
    email.value = route.query.email as string;
  } else {
    showToast({ title: 'Error', message: t('reset_password.missing_token'), type: 'error', duration: 0 });
  }
});

const handleResetPassword = async (): Promise<void> => {
  if (!token.value || !email.value) return;

  loading.value = true;
  try {
    await api.post('/api/reset-password', {
      token: token.value,
      email: email.value,
      password: password.value,
      password_confirmation: password_confirmation.value
    });
    showToast({
      title: t('reset_password.title'),
      message: t('reset_password.success_message'),
      type: 'success',
      icon: '🔑',
      duration: 6000,
    });
    router.push('/login');
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string, errors?: Record<string, string[]> } } };
    const message = err.response?.data?.errors
      ? Object.values(err.response.data.errors).flat().join(', ')
      : err.response?.data?.message ?? t('reset_password.error_generic');
    showToast({ title: 'Error', message, type: 'error' });
  } finally {
    loading.value = false;
  }
};
</script>
