<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useI18n } from 'vue-i18n';
import { useTimeoutFn } from '@vueuse/core';
import { useHead } from '@unhead/vue';
import UserAvatarMenu from './components/UserAvatarMenu.vue';
import AppFooter from './components/AppFooter.vue';
import AppBreadcrumb from './components/AppBreadcrumb.vue';
import RegisterModal from './components/RegisterModal.vue';


const auth = useAuthStore();
const { locale } = useI18n();

useHead({
  titleTemplate: (title) => title ? `${title} | TalentFoot` : 'TalentFoot - Premium Football Courses',
  meta: [
    { name: 'description', content: 'Master your football skills with premium video tutorials, training clips, and challenges. Improve your game today.' },
    { name: 'robots', content: 'index, follow' }
  ]
});

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
    <!-- Glassmorphic Navbar (always visible) -->
    <nav class="glass-nav sticky top-0 z-40 px-6 py-3 flex justify-between items-center">
      <div class="flex items-center gap-8">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2 group">
          <span class="text-2xl">⚽</span>
          <span class="font-heading font-extrabold text-xl gradient-text tracking-tight">TalentFoot</span>
        </router-link>
        <!-- Nav Links -->
        <div class="hidden md:flex items-center gap-1">
            <!-- Public links (always visible) -->
            <router-link to="/" class="nav-pill">
              {{ $t('nav.dashboard') }}
            </router-link>
            <router-link to="/courses" class="nav-pill" :class="{ 'router-link-active': $route.path.startsWith('/courses') }">
              {{ $t('nav.courses') }}
            </router-link>
            <router-link to="/tags" class="nav-pill" :class="{ 'router-link-active': $route.path.startsWith('/tags') }">
              {{ $t('nav.tags') }}
            </router-link>
            <router-link to="/categories" class="nav-pill" :class="{ 'router-link-active': $route.path.startsWith('/categories') }">
              {{ $t('nav.categories') }}
            </router-link>
            <!-- Auth-only links -->
            <router-link v-if="auth.isAuthenticated" to="/my-challenges" class="nav-pill" :class="{ 'router-link-active': $route.path.startsWith('/my-challenges') || $route.path.startsWith('/challenge/') }">
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
                    {{ $t('nav.upload') }}
                  </router-link>
                  <router-link to="/users" class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.06]" style="color: var(--tf-text);" @click="showManagement = false">
                    {{ $t('nav.users') }}
                  </router-link>
                </div>
              </transition>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
            <select v-model="locale" class="select-modern text-xs py-1.5 px-2" aria-label="Select Language">
                <option value="en">EN</option>
                <option value="pl">PL</option>
                <option value="es">ES</option>
            </select>
            <!-- Authenticated: avatar menu -->
            <UserAvatarMenu v-if="auth.isAuthenticated" />
            <!-- Guest: Login / Register buttons -->
            <template v-else>
              <router-link to="/login" class="nav-pill text-sm font-semibold">
                {{ $t('auth.login') }}
              </router-link>
              <router-link to="/register" class="btn-primary text-sm px-4 py-1.5 rounded-full font-semibold">
                {{ $t('auth.register') }}
              </router-link>
            </template>
        </div>
    </nav>
    <main class="p-1 pl-4 max-w-7xl mx-auto flex-1 w-full">
      <AppBreadcrumb v-if="$route.path !== '/'" />
      <Transition name="page" mode="out-in">
        <router-view></router-view>
      </Transition>
    </main>
    <AppFooter />

    <!-- Global Modals -->
    <RegisterModal v-if="auth.showRegisterModal" @close="auth.showRegisterModal = false" />
  </div>
</template>
