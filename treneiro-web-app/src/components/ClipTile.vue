<script setup lang="ts">
import type { Clip, Challenge } from '../types';
import ClipCard from './ClipCard.vue';
import IconTrophy from './icons/IconTrophy.vue';
import IconLightning from './icons/IconLightning.vue';

defineProps<{
    clip: Clip;
    challenge?: Pick<Challenge, 'is_completed' | 'watched_items' | 'total_items'> | null;
}>();

const emit = defineEmits<{
    (e: 'rate', clipId: string, rating: number): void;
    (e: 'start-challenge', clip: Clip): void;
}>();
</script>

<template>
    <ClipCard :clip="clip" :show-rate-select="true" @rate="(clipId, rating) => emit('rate', clipId, rating)">
        <!-- Full-width challenge progress or start button -->
        <div class="mt-4 pt-3" style="border-top: 1px solid var(--tf-border);">
            <!-- Active challenge progress bar -->
            <div v-if="challenge" class="flex items-center gap-2">
                <IconTrophy v-if="challenge.is_completed" :size="14" class="flex-shrink-0" style="color: var(--tf-accent-emerald);" />
                <IconLightning v-else :size="14" class="flex-shrink-0" style="color: var(--tf-accent-amber);" />
                <div class="flex-1 h-1.5 rounded-full" style="background: rgba(255,255,255,0.08);">
                    <div class="h-1.5 rounded-full transition-all duration-500"
                         :style="`width: ${(challenge.watched_items / challenge.total_items) * 100}%; background: ${challenge.is_completed ? 'var(--tf-gradient-primary)' : 'var(--tf-gradient-warm)'};`"></div>
                </div>
                <span class="text-[10px] flex-shrink-0" style="color: var(--tf-text-dimmed);">{{ challenge.watched_items }}/{{ challenge.total_items }}</span>
            </div>
            <!-- Start Challenge button (full width) -->
            <button v-else @click.prevent="$emit('start-challenge', clip)" class="w-full text-xs px-3 py-2 rounded-lg font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2" style="background: rgba(251,191,36,0.15); color: var(--tf-accent-amber); border: 1px solid rgba(251,191,36,0.3);">
                <IconLightning :size="14" class="text-current" /> {{ $t('challenges.start_btn') }}
            </button>
        </div>
    </ClipCard>
</template>
