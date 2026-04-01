<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';

const { t } = useI18n();
const auth = useAuthStore();
const emit = defineEmits<{ (e: 'close'): void }>();

const props = withDefaults(defineProps<{ isGuest?: boolean }>(), { isGuest: false });

const GUEST_LS_KEY = 'treneiro_guest_tour_dismissed';

const currentStep = ref(0);
const dontShowAgain = ref(false);

const steps = computed(() => [
    {
        icon: '🎬',
        color: 'var(--tf-accent-emerald)',
        bgColor: 'rgba(110,231,183,0.1)',
        borderColor: 'rgba(110,231,183,0.2)',
        title: t('onboarding.step1_title'),
        description: t('onboarding.step1_desc'),
    },
    {
        icon: '👁',
        color: 'var(--tf-accent-cyan)',
        bgColor: 'rgba(34,211,238,0.1)',
        borderColor: 'rgba(34,211,238,0.2)',
        title: t('onboarding.step2_title'),
        description: t('onboarding.step2_desc'),
    },
    {
        icon: '💎',
        color: 'var(--tf-accent-violet)',
        bgColor: 'rgba(167,139,250,0.1)',
        borderColor: 'rgba(167,139,250,0.2)',
        title: t('onboarding.step3_title'),
        description: t('onboarding.step3_desc'),
    },
    {
        icon: '⚡',
        color: 'var(--tf-accent-amber)',
        bgColor: 'rgba(251,191,36,0.1)',
        borderColor: 'rgba(251,191,36,0.2)',
        title: t('onboarding.step4_title'),
        description: t('onboarding.step4_desc'),
    },
]);

const isLast = computed(() => currentStep.value === steps.value.length - 1);
const isFirst = computed(() => currentStep.value === 0);
const step = computed(() => steps.value[currentStep.value]!);

const next = () => {
    if (isLast.value) {
        handleClose();
    } else {
        currentStep.value++;
    }
};

const prev = () => {
    if (!isFirst.value) currentStep.value--;
};

const handleClose = async () => {
    if (dontShowAgain.value) {
        if (props.isGuest) {
            localStorage.setItem(GUEST_LS_KEY, 'true');
        } else {
            await auth.updateShowTips(false);
        }
    }
    emit('close');
};
</script>

<template>
    <!-- Backdrop -->
    <Teleport to="body">
        <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <!-- Overlay -->
            <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="handleClose"></div>

            <!-- Modal -->
            <div class="relative w-full max-w-lg" style="animation: tourSlideIn 0.3s ease-out;">
                <div class="card-static overflow-hidden" style="border-radius: var(--tf-radius-xl); border: 1px solid var(--tf-border);">
                    <!-- Header with step icon -->
                    <div class="relative px-8 pt-10 pb-6 text-center" :style="`background: ${step.bgColor};`">
                        <!-- Close button -->
                        <button @click="handleClose"
                            class="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                            style="background: rgba(255,255,255,0.1); color: var(--tf-text-muted);">
                            ✕
                        </button>

                        <!-- Static Illustration Image instead of animated icon box -->
                        <div class="mb-4 mx-auto w-full max-w-[320px] rounded-lg overflow-hidden flex items-center justify-center pointer-events-none"
                             style="box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05); animation: tourFadeUp 0.4s ease-out;"
                             :key="'img-' + currentStep">
                            <img :src="`/onboarding/tour-step-${currentStep + 1}.svg`" 
                                 :alt="step.title" 
                                 class="w-full h-auto object-cover" />
                        </div>

                        <!-- Step counter -->
                        <p class="text-xs font-semibold uppercase tracking-widest mb-2" style="color: var(--tf-text-dimmed);">
                            {{ t('onboarding.step_of', { current: currentStep + 1, total: steps.length }) }}
                        </p>

                        <!-- Title -->
                        <h2 class="text-2xl font-heading font-bold" :style="`color: ${step.color};`"
                            :key="'title-' + currentStep"
                            style="animation: tourFadeUp 0.3s ease-out;">
                            {{ step.title }}
                        </h2>
                    </div>

                    <!-- Body -->
                    <div class="px-8 py-6">
                        <p class="text-center leading-relaxed"
                           :key="'desc-' + currentStep"
                           style="color: var(--tf-text-muted); animation: tourFadeUp 0.35s ease-out;">
                            {{ step.description }}
                        </p>
                    </div>

                    <!-- Footer -->
                    <div class="px-8 pb-6">
                        <!-- Dot indicators -->
                        <div class="flex justify-center gap-2 mb-5">
                            <button v-for="(_, i) in steps" :key="i"
                                @click="currentStep = i"
                                class="w-2.5 h-2.5 rounded-full transition-all duration-300"
                                :style="i === currentStep
                                    ? `background: ${step.color}; transform: scale(1.3);`
                                    : 'background: rgba(255,255,255,0.15);'"
                            ></button>
                        </div>

                        <!-- Navigation buttons -->
                        <div class="flex items-center gap-3">
                            <button v-if="!isFirst" @click="prev"
                                class="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                                style="background: rgba(255,255,255,0.06); color: var(--tf-text-muted); border: 1px solid var(--tf-border);">
                                ← {{ t('onboarding.back') }}
                            </button>
                            <button v-else @click="handleClose"
                                class="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                                style="color: var(--tf-text-dimmed);">
                                {{ t('onboarding.skip') }}
                            </button>

                            <button @click="next"
                                class="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                                :style="`background: ${step.bgColor}; color: ${step.color}; border: 1px solid ${step.borderColor};`">
                                {{ isLast ? t('onboarding.get_started') : t('onboarding.next') }} →
                            </button>
                        </div>

                        <!-- Don't show again -->
                        <label class="flex items-center justify-center gap-2 mt-4 cursor-pointer">
                            <input type="checkbox" v-model="dontShowAgain"
                                class="w-4 h-4 rounded accent-emerald-400" />
                            <span class="text-xs" style="color: var(--tf-text-dimmed);">
                                {{ t('onboarding.dont_show_again') }}
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
@keyframes tourSlideIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes tourIconPop {
    0% { transform: scale(0.5); opacity: 0; }
    60% { transform: scale(1.15); }
    100% { transform: scale(1); opacity: 1; }
}
@keyframes tourFadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
