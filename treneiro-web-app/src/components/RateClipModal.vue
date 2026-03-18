<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import IconStar from './icons/IconStar.vue';

const props = defineProps<{
    initialRating?: number;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'submit', rating: number): void;
}>();

const { t } = useI18n();

const rating = ref(props.initialRating || 0);
const hoverRating = ref(0);

const setRating = (val: number) => {
    rating.value = val;
};

const submitRating = () => {
    if (rating.value > 0) {
        emit('submit', rating.value);
    }
};
</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(15, 14, 23, 0.85); backdrop-filter: blur(8px); animation: fadeIn 0.2s ease-out;">
        <div class="relative w-full max-w-sm" style="animation: tourSlideIn 0.3s ease-out;">
            <div class="card-static overflow-hidden p-6 text-center" style="border-radius: var(--tf-radius-xl); border: 1px solid var(--tf-border);">
                <!-- Close Button -->
                <button @click="$emit('close')"
                    class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style="background: rgba(255,255,255,0.05); color: var(--tf-text-muted);">
                    ✕
                </button>

                <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(16, 185, 129, 0.1);">
                    <IconStar :size="32" style="color: var(--tf-accent-emerald);" />
                </div>

                <h2 class="text-xl font-heading font-bold mb-2" style="color: var(--tf-text);">{{ t('dashboard.rate_modal_title') }}</h2>
                <p class="text-sm mb-6" style="color: var(--tf-text-muted);">{{ t('dashboard.rate_placeholder') }}</p>

                <!-- 10 Stars Rating -->
                <div class="flex flex-wrap items-center justify-center gap-[2px] mb-8" @mouseleave="hoverRating = 0">
                    <button
                        v-for="star in 10"
                        :key="star"
                        @mouseover="hoverRating = star"
                        @click="setRating(star)"
                        class="p-0.5 transition-transform hover:scale-125 focus:outline-none"
                    >
                        <IconStar
                            :size="20"
                            class="transition-colors duration-200"
                            :style="(hoverRating ? star <= hoverRating : star <= rating) ? 'color: var(--tf-accent-emerald); filter: drop-shadow(0 0 6px rgba(16,185,129,0.4));' : 'color: rgba(255,255,255,0.15);'"
                        />
                    </button>
                    <!-- Current Selection Text -->
                    <div class="w-full mt-3 text-sm font-semibold h-5" style="color: var(--tf-accent-emerald);">
                        <span v-if="hoverRating > 0 || rating > 0">{{ hoverRating || rating }} / 10</span>
                    </div>
                </div>

                <!-- Submit Button -->
                <button
                    @click="submitRating"
                    :disabled="rating === 0"
                    class="w-full py-3 rounded-lg font-bold text-sm transition-all"
                    :style="rating > 0
                        ? 'background: var(--tf-gradient-primary); color: #0f0e17; box-shadow: 0 4px 15px -3px rgba(16,185,129,0.3);'
                        : 'background: rgba(255,255,255,0.05); color: var(--tf-text-muted); cursor: not-allowed; opacity: 0.7;'"
                >
                    {{ t('dashboard.rate_modal_submit') }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes tourSlideIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
