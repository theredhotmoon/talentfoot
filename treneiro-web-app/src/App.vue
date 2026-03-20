<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useI18n } from 'vue-i18n';
import { useTimeoutFn } from '@vueuse/core';
import UserAvatarMenu from './components/UserAvatarMenu.vue';
import AppFooter from './components/AppFooter.vue';
import IconUpload from './components/icons/IconUpload.vue';
import IconUsers from './components/icons/IconUsers.vue';

const auth = useAuthStore();
const { locale } = useI18n();

onMounted(async () => {
  if (auth.token) {
    await auth.fetchUser();
  }
});

const showManagement = ref(false);

// VueUse useTimeoutFn replaces the raw setTimeout / clearTimeout pair for hover-leave delay.
const { start: startCloseTimer, stop: stopCloseTimer } = useTimeoutFn(
  () => { showManagement.value = false; },
  200,
  { immediate: false },
);

const openManagement = () => {
  stopCloseTimer();
  showManagement.value = true;
};

const closeManagement = () => {
  startCloseTimer();
};
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--tf-bg-deep); color: var(--tf-text);">
    <!-- Glassmorphic Navbar -->
    <nav v-if="auth.token" class="glass-nav sticky top-0 z-40 px-6 py-3 flex justify-between items-center">
      <div class="flex items-center gap-8">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2 group">
          <span class="text-2xl">⚽</span>
          <span class="font-heading font-extrabold text-xl gradient-text tracking-tight">TalentFoot</span>
        </router-link>
        <!-- Nav Links -->
        <div class="hidden md:flex items-center gap-1">
            <router-link to="/" class="nav-pill">
              {{ $t('nav.dashboard') }}
            </router-link>
            <router-link to="/tags" class="nav-pill">
              {{ $t('nav.tags') }}
            </router-link>
            <router-link to="/categories" class="nav-pill">
              {{ $t('nav.categories') }}
            </router-link>
            <router-link to="/my-challenges" class="nav-pill">
              {{ $t('nav.my_challenges') }}
            </router-link>
            <!-- Management dropdown (admin only) -->
            <div v-if="auth.isAdmin" class="relative" @mouseenter="openManagement" @mouseleave="closeManagement">
              <button @click="showManagement = !showManagement" class="nav-pill flex items-center gap-1">
                ⚙️ {{ $t('nav.management') }}
                <svg class="w-3.5 h-3.5 transition-transform duration-200" :class="{ 'rotate-180': showManagement }" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <transition name="dropdown">
                <div v-if="showManagement" class="absolute top-full left-0 mt-2 py-2 min-w-[180px] rounded-xl overflow-hidden z-50" style="background: var(--tf-bg-surface-solid); border: 1px solid var(--tf-border); box-shadow: 0 12px 40px rgba(0,0,0,0.5);">
                  <router-link to="/upload" class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.06]" style="color: var(--tf-text);" @click="showManagement = false">
                    <IconUpload :size="18" class="text-current" /> {{ $t('nav.upload') }}
                  </router-link>
                  <router-link to="/users" class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.06]" style="color: var(--tf-text);" @click="showManagement = false">
                    <IconUsers :size="18" class="text-current" /> {{ $t('nav.users') }}
                  </router-link>
                </div>
              </transition>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
            <select v-model="locale" class="select-modern text-xs py-1.5 px-2">
                <option value="en">EN</option>
                <option value="pl">PL</option>
                <option value="es">ES</option>
            </select>
            <UserAvatarMenu />
        </div>
    </nav>
    <main class="p-6 max-w-7xl mx-auto flex-1 w-full">
      <Transition name="page" mode="out-in">
        <router-view></router-view>
      </Transition>
    </main>
    <AppFooter />
  </div>
</template>
