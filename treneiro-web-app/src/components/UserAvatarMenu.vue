<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import EditProfileModal from './EditProfileModal.vue';
import ChangePasswordModal from './ChangePasswordModal.vue';
import WelcomeTourModal from './WelcomeTourModal.vue';
import IconEdit from './icons/IconEdit.vue';
import IconLock from './icons/IconLock.vue';
import IconLightbulb from './icons/IconLightbulb.vue';
import IconQuestion from './icons/IconQuestion.vue';
import IconLogout from './icons/IconLogout.vue';

const auth = useAuthStore();
const router = useRouter();

const isOpen = ref(false);
const showEditProfile = ref(false);
const showChangePassword = ref(false);
const showWelcomeTour = ref(false);
const menuRef = ref<HTMLElement | null>(null);

const initials = computed(() => {
    if (!auth.user?.name) return '?';
    return auth.user.name
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
});

const handleLogout = async () => {
    isOpen.value = false;
    await auth.logout();
    router.push('/login');
};

const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
        isOpen.value = false;
    }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>

<template>
    <div ref="menuRef" class="relative">
        <!-- Avatar button -->
        <button
            @click="isOpen = !isOpen"
            class="w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style="background: var(--tf-gradient-secondary); color: white; focus-ring-color: var(--tf-accent-violet);"
            :title="auth.user?.name || ''"
        >
            {{ initials }}
        </button>

        <!-- Dropdown -->
        <Transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0 scale-95 -translate-y-1"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
            <div v-if="isOpen" class="absolute right-0 mt-2 w-64 card-static z-50" style="border-radius: var(--tf-radius-xl);">
                <!-- User info header -->
                <div class="px-4 py-3" style="border-bottom: 1px solid var(--tf-border);">
                    <p class="font-semibold truncate" style="color: var(--tf-text);">{{ auth.user?.name }}</p>
                    <p class="text-xs truncate" style="color: var(--tf-text-muted);">{{ auth.user?.email }}</p>
                    <span class="mt-1.5 inline-block text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-semibold"
                        :style="auth.isAdmin
                            ? 'background: rgba(167, 139, 250, 0.15); color: var(--tf-accent-violet);'
                            : 'background: rgba(255,255,255,0.06); color: var(--tf-text-dimmed);'"
                    >
                        {{ auth.user?.role }}
                    </span>
                </div>

                <!-- Menu items -->
                <div class="py-1">
                    <button
                        @click="showEditProfile = true; isOpen = false"
                        class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors" style="color: var(--tf-text-muted);"
                        onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.color='var(--tf-text)'"
                        onmouseout="this.style.background='transparent'; this.style.color='var(--tf-text-muted)'"
                    >
                        <IconEdit :size="18" class="text-current" />
                        {{ $t('profile.edit_details') }}
                    </button>
                    <!-- Show "Change Password" only if the user logged in with email/password -->
                    <button
                        v-if="!auth.user?.auth_provider"
                        @click="showChangePassword = true; isOpen = false"
                        class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors" style="color: var(--tf-text-muted);"
                        onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.color='var(--tf-text)'"
                        onmouseout="this.style.background='transparent'; this.style.color='var(--tf-text-muted)'"
                    >
                        <IconLock :size="18" class="text-current" />
                        {{ $t('profile.change_password') }}
                    </button>
                </div>

                <!-- Tips & Help -->
                <div style="border-top: 1px solid var(--tf-border);" class="py-1">
                    <div class="w-full px-4 py-2.5 flex items-center justify-between">
                        <span class="text-sm flex items-center gap-3" style="color: var(--tf-text-muted);">
                            <IconLightbulb :size="18" class="text-current" />
                            {{ $t('onboarding.show_tips') }}
                        </span>
                        <button
                            @click="auth.updateShowTips(!auth.showTips)"
                            class="relative w-10 h-5 rounded-full transition-all duration-200"
                            :style="auth.showTips
                                ? 'background: var(--tf-accent-emerald);'
                                : 'background: rgba(255,255,255,0.15);'"
                        >
                            <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200"
                                  :style="auth.showTips ? 'left: 1.375rem;' : 'left: 0.125rem;'"></span>
                        </button>
                    </div>
                    <button
                        @click="showWelcomeTour = true; isOpen = false"
                        class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors"
                        style="color: var(--tf-text-muted);"
                        onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.color='var(--tf-text)'"
                        onmouseout="this.style.background='transparent'; this.style.color='var(--tf-text-muted)'"
                    >
                        <IconQuestion :size="18" class="text-current" />
                        {{ $t('onboarding.how_it_works') }}
                    </button>
                </div>

                <!-- Logout -->
                <div style="border-top: 1px solid var(--tf-border);" class="py-1">
                    <button
                        @click="handleLogout"
                        class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors" style="color: #f87171;"
                        onmouseover="this.style.background='rgba(239,68,68,0.08)'"
                        onmouseout="this.style.background='transparent'"
                    >
                        <IconLogout :size="18" class="text-current" />
                        {{ $t('nav.logout') }}
                    </button>
                </div>
            </div>
        </Transition>

        <!-- Modals -->
        <EditProfileModal v-if="showEditProfile" @close="showEditProfile = false" />
        <ChangePasswordModal v-if="showChangePassword" @close="showChangePassword = false" />
        <WelcomeTourModal v-if="showWelcomeTour" @close="showWelcomeTour = false" />
    </div>
</template>
