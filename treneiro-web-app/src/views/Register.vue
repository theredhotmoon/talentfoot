<template>
  <div class="auth-bg flex justify-center items-center min-h-screen">
    <div class="relative z-10 card-static p-8 w-full max-w-md mx-4 animate-fade-up" style="border-radius: var(--tf-radius-2xl);">
      <!-- Logo -->
      <div class="text-center mb-8">
        <span class="text-3xl">⚽</span>
        <h1 class="font-heading font-extrabold text-2xl gradient-text mt-2">TalentFoot</h1>
        <p class="text-sm mt-1" style="color: var(--tf-text-muted);">{{ $t('register.title') }}</p>
      </div>

      <RegisterForm :redirect="true" />
      
      <p class="mt-6 text-sm text-center" style="color: var(--tf-text-muted);">
        {{ $t('register.has_account') }}
        <router-link to="/login" class="font-semibold transition-colors" style="color: var(--tf-accent-violet);">{{ $t('register.login_link') }}</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import RegisterForm from '../components/RegisterForm.vue';
</script>
