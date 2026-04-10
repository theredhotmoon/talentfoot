<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import IconStar from './icons/IconStar.vue';
import IconLightbulb from './icons/IconLightbulb.vue';
import IconUser from './icons/IconUser.vue';
import RegisterForm from './RegisterForm.vue';

const emit = defineEmits<{
    (e: 'close'): void;
}>();

const { t } = useI18n();

// Disabled star preview
const hoverStar = ref(0);
</script>

<template>
    <Teleport to="body">
        <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <!-- Overlay -->
            <div class="absolute inset-0 backdrop-blur-sm" style="background: rgba(15, 14, 23, 0.88);" @click="emit('close')"></div>

            <!-- Modal Content -->
            <div class="relative w-full max-w-5xl" style="animation: loginRateSlideIn 0.35s ease-out;">
                <div class="card-static overflow-hidden relative" style="border-radius: var(--tf-radius-2xl); border: 1px solid var(--tf-border);">
                    <!-- Close button -->
                    <button @click="emit('close')"
                        class="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style="background: rgba(255,255,255,0.05); color: var(--tf-text-muted);">
                        ✕
                    </button>

                    <!-- Top Header -->
                    <div class="text-center px-8 pt-8 pb-6" style="border-bottom: 1px solid var(--tf-border);">
                        <h2 class="font-heading font-extrabold text-2xl gradient-text">{{ t('auth.login_to_rate_title') }}</h2>
                        <p class="text-sm mt-1 max-w-lg mx-auto" style="color: var(--tf-text-muted);">{{ t('auth.login_to_rate_subtitle') }}</p>
                    </div>

                    <!-- 3-column layout -->
                    <div class="login-rate-grid">
                        <!-- COLUMN 1: Disabled Rating -->
                        <div class="login-rate-col relative group/rate" style="background: rgba(255,255,255,0.015);">
                            <!-- Lock overlay -->
                            <div class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none" style="background: rgba(15,14,23,0.25);">
                                <div class="w-14 h-14 rounded-full flex items-center justify-center" style="background: rgba(255,255,255,0.08); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1);">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--tf-text-muted);">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                </div>
                            </div>

                            <!-- Tooltip on hover -->
                            <div class="rate-tooltip">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0" style="color: var(--tf-accent-amber);">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                <span>{{ t('auth.rate_tooltip') }}</span>
                            </div>

                            <!-- Column header -->
                            <div class="flex items-center gap-2 mb-5">
                                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: rgba(16,185,129,0.12);">
                                    <IconStar :size="16" style="color: var(--tf-accent-emerald);" />
                                </div>
                                <h3 class="font-heading font-bold text-sm" style="color: var(--tf-text);">{{ t('auth.col_rate_title') }}</h3>
                            </div>

                            <!-- Disabled star icon -->
                            <div class="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center opacity-40" style="background: rgba(16, 185, 129, 0.1);">
                                <IconStar :size="28" style="color: var(--tf-accent-emerald);" />
                            </div>

                            <p class="text-xs text-center mb-4 opacity-35" style="color: var(--tf-text-muted);">{{ t('dashboard.rate_placeholder') }}</p>

                            <!-- Disabled 10 stars -->
                            <div class="flex flex-wrap items-center justify-center gap-[1px] mb-5 opacity-30" @mouseleave="hoverStar = 0">
                                <div
                                    v-for="star in 10"
                                    :key="star"
                                    class="p-0.5"
                                    @mouseenter="hoverStar = star"
                                >
                                    <IconStar
                                        :size="16"
                                        class="transition-colors duration-200"
                                        :style="(hoverStar && star <= hoverStar) ? 'color: rgba(16,185,129,0.4); filter: drop-shadow(0 0 4px rgba(16,185,129,0.2));' : 'color: rgba(255,255,255,0.15);'"
                                    />
                                </div>
                                <div class="w-full mt-2 text-xs font-semibold h-4 text-center" style="color: var(--tf-text-dimmed);">
                                    <span v-if="hoverStar > 0">{{ hoverStar }} / 10</span>
                                </div>
                            </div>

                            <!-- Disabled submit -->
                            <button
                                disabled
                                class="w-full py-2.5 rounded-lg font-bold text-xs opacity-30 cursor-not-allowed"
                                style="background: rgba(255,255,255,0.05); color: var(--tf-text-muted);"
                            >
                                {{ t('dashboard.rate_modal_submit') }}
                            </button>
                        </div>

                        <!-- Divider 1 -->
                        <div class="hidden md:block w-px self-stretch" style="background: var(--tf-border);"></div>
                        <div class="md:hidden h-px w-full" style="background: var(--tf-border);"></div>

                        <!-- COLUMN 2: Why Login -->
                        <div class="login-rate-col">
                            <!-- Column header -->
                            <div class="flex items-center gap-2 mb-5">
                                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: rgba(167,139,250,0.12);">
                                    <IconLightbulb :size="16" style="color: var(--tf-accent-violet);" />
                                </div>
                                <h3 class="font-heading font-bold text-sm" style="color: var(--tf-text);">{{ t('auth.col_why_title') }}</h3>
                            </div>

                            <!-- Benefit points -->
                            <div class="space-y-2.5">
                                <div class="flex items-start gap-2.5 p-2.5 rounded-xl" style="background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.12);">
                                    <span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5" style="background: var(--tf-gradient-primary); color: #0f0e17;">1</span>
                                    <p class="text-xs leading-relaxed" style="color: var(--tf-text-muted);">{{ t('auth.login_reason_1') }}</p>
                                </div>
                                <div class="flex items-start gap-2.5 p-2.5 rounded-xl" style="background: rgba(167,139,250,0.06); border: 1px solid rgba(167,139,250,0.12);">
                                    <span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5" style="background: linear-gradient(135deg, var(--tf-accent-violet), var(--tf-accent-cyan)); color: #0f0e17;">2</span>
                                    <p class="text-xs leading-relaxed" style="color: var(--tf-text-muted);">{{ t('auth.login_reason_2') }}</p>
                                </div>
                                <div class="flex items-start gap-2.5 p-2.5 rounded-xl" style="background: rgba(251,191,36,0.06); border: 1px solid rgba(251,191,36,0.12);">
                                    <span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5" style="background: linear-gradient(135deg, var(--tf-accent-amber), var(--tf-accent-orange)); color: #0f0e17;">3</span>
                                    <p class="text-xs leading-relaxed" style="color: var(--tf-text-muted);">{{ t('auth.login_reason_3') }}</p>
                                </div>
                                <div class="flex items-start gap-2.5 p-2.5 rounded-xl" style="background: rgba(34,211,238,0.06); border: 1px solid rgba(34,211,238,0.12);">
                                    <span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5" style="background: linear-gradient(135deg, var(--tf-accent-cyan), var(--tf-accent-emerald)); color: #0f0e17;">4</span>
                                    <p class="text-xs leading-relaxed" style="color: var(--tf-text-muted);">{{ t('auth.login_reason_4') }}</p>
                                </div>
                            </div>

                            <!-- Ball mascot -->
                            <div class="flex justify-center mt-6">
                                <span class="text-3xl" style="filter: drop-shadow(0 0 12px rgba(16,185,129,0.3));">⚽</span>
                            </div>
                        </div>

                        <!-- Divider 2 -->
                        <div class="hidden md:block w-px self-stretch" style="background: var(--tf-border);"></div>
                        <div class="md:hidden h-px w-full" style="background: var(--tf-border);"></div>

                        <!-- COLUMN 3: Registration Form -->
                        <div class="login-rate-col">
                            <!-- Column header -->
                            <div class="flex items-center gap-2 mb-5">
                                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: rgba(251,191,36,0.12);">
                                    <IconUser :size="16" style="color: var(--tf-accent-amber);" />
                                </div>
                                <h3 class="font-heading font-bold text-sm" style="color: var(--tf-text);">{{ t('auth.col_register_title') }}</h3>
                            </div>

                            <!-- Register form -->
                            <RegisterForm :redirect="false" @success="emit('close')" />

                            <!-- Login link -->
                            <p class="mt-4 text-xs text-center" style="color: var(--tf-text-muted);">
                                {{ t('register.has_account') }}
                                <router-link to="/login" @click="emit('close')" class="font-semibold transition-colors" style="color: var(--tf-accent-violet);">
                                    {{ t('register.login_link') }}
                                </router-link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
@keyframes loginRateSlideIn {
    from { opacity: 0; transform: translateY(24px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

.login-rate-grid {
    display: flex;
    flex-direction: column;
}

.login-rate-col {
    flex: 1;
    padding: 1.5rem;
}

@media (min-width: 768px) {
    .login-rate-grid {
        flex-direction: row;
    }
    .login-rate-col {
        flex: 1 1 33.333%;
        min-width: 0;
    }
}

.rate-tooltip {
    position: absolute;
    bottom: 0.75rem;
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.75rem;
    font-size: 0.7rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
    background: var(--tf-bg-surface-solid);
    border: 1px solid var(--tf-border);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    color: var(--tf-text-muted);
}

.group\/rate:hover .rate-tooltip {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}
</style>
