<template>
  <div class="auth-bg flex justify-center items-center min-h-screen">
    <div class="relative z-10 text-center">
      <div class="w-10 h-10 rounded-full mx-auto mb-4 animate-spin" style="border: 3px solid var(--tf-border); border-top-color: var(--tf-accent-emerald);"></div>
      <p v-if="error" class="text-sm" style="color: #f87171;">{{ error }}</p>
      <p v-else class="text-sm" style="color: var(--tf-text-muted);">{{ $t('login.signing_in') || 'Signing you in...' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const error = ref('');

onMounted(async () => {
    const token = route.query.token as string;
    const errorParam = route.query.error as string;

    if (errorParam) {
        error.value = 'Google login failed. Please try again.';
        setTimeout(() => router.push('/login'), 2000);
        return;
    }

    if (token) {
        try {
            await auth.setTokenAndFetchUser(token);
            router.push('/');
        } catch (e) {
            error.value = 'Failed to complete login.';
            setTimeout(() => router.push('/login'), 2000);
        }
    } else {
        router.push('/login');
    }
});
</script>
