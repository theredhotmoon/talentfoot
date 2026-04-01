<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('close')"></div>

      <!-- Modal Content -->
      <div class="relative w-full max-w-md" style="animation: modalSlideUp 0.3s ease-out;">
        <div class="card-static p-8 overflow-hidden relative" style="border-radius: var(--tf-radius-2xl); border: 1px solid var(--tf-border);">
          <!-- Close button -->
          <button @click="$emit('close')"
              class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style="background: rgba(255,255,255,0.05); color: var(--tf-text-muted);">
              ✕
          </button>

          <!-- Logo & Header -->
          <div class="text-center mb-8 mt-2">
            <span class="text-3xl">⚽</span>
            <h1 class="font-heading font-extrabold text-2xl gradient-text mt-2">TalentFoot</h1>
            <p class="text-sm mt-1" style="color: var(--tf-text-muted);">{{ $t('register.title') }}</p>
          </div>

          <!-- Reusable Form -->
          <RegisterForm :redirect="false" @success="handleSuccess" />

          <!-- Login Link -->
          <p class="mt-6 text-sm text-center" style="color: var(--tf-text-muted);">
            {{ $t('register.has_account') }}
            <!-- Close modal and go to login page, or open login modal if that existed -->
            <router-link to="/login" @click="$emit('close')" class="font-semibold transition-colors" style="color: var(--tf-accent-violet);">
              {{ $t('register.login_link') }}
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import RegisterForm from './RegisterForm.vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const handleSuccess = () => {
  emit('close');
};
</script>

<style scoped>
@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
