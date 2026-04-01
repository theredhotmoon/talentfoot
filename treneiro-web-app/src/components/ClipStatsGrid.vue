<script setup lang="ts">
defineProps<{
    difficulty: number;
    views: number;
    comments?: number;
    rating: string | number;
    ratingsCount: number;
    category?: { id: string; name: any } | null;
    categoryLabel?: string;
    subclipsCount?: number;
    participantsCount?: number;
    completedCount?: number;
    showRateSelect?: boolean;
}>();
import IconFlame from './icons/IconFlame.vue';
import IconEye from './icons/IconEye.vue';
import IconMessage from './icons/IconMessage.vue';
import IconStar from './icons/IconStar.vue';
import IconBook from './icons/IconBook.vue';
import IconUsers from './icons/IconUsers.vue';
import IconFolder from './icons/IconFolder.vue';

const emit = defineEmits<{
    (e: 'rate', rating: number): void;
    (e: 'open-rate-modal'): void;
}>();

// Removed unneeded onRate select handler
</script>

<template>
    <div class="flex flex-col gap-2 w-full text-xs" style="color: var(--tf-text-muted);">
        <!-- Line 1: Views, Difficulty, Comments -->
        <div class="flex items-center justify-between w-full">
            <span class="flex-1 flex justify-start items-center gap-1.5" :title="$t('dashboard.views') || $t('sort.views')">
                <IconEye :size="14" class="text-current" /> <span style="color: var(--tf-accent-cyan);">{{ views }}</span>
            </span>
            <span class="flex-1 flex justify-start items-center gap-1.5" :title="$t('dashboard.difficulty') || $t('sort.difficulty')">
                <IconFlame :size="14" class="text-current" /> <span style="color: var(--tf-accent-amber);">{{ difficulty }}/10</span>
            </span>
            <span class="flex-1 flex justify-start items-center gap-1.5" :title="$t('sort.comments')">
                <template v-if="comments !== undefined">
                    <IconMessage :size="14" class="text-current" /> <span style="color: var(--tf-accent-violet);">{{ comments }}</span>
                </template>
            </span>
        </div>

        <!-- Line 2: Participants, Subclips, Rating (or Category) -->
        <div class="flex items-center justify-between w-full">
            <span class="flex-1 flex justify-start items-center gap-1.5">
                <template v-if="participantsCount !== undefined">
                    <span class="flex items-center gap-1.5 cursor-help" :title="`${participantsCount} ${$t('dashboard.participants')}. ${completedCount || 0} ${$t('clip_detail.completed') || 'completed'}.`">
                        <IconUsers :size="14" class="text-current" /> <span style="color: var(--tf-accent-cyan);">{{ participantsCount }}</span>
                    </span>
                </template>
            </span>

            <span class="flex-1 flex justify-start items-center gap-1.5">
                <template v-if="subclipsCount !== undefined">
                    <span class="flex items-center gap-1.5" :title="$t('dashboard.subclips')">
                        <IconBook :size="14" class="text-current" /> <span style="color: var(--tf-accent-violet);">{{ subclipsCount }}</span>
                    </span>
                </template>
            </span>

            <span class="flex-1 flex justify-start items-center gap-1.5" :title="$t('dashboard.rating') || $t('sort.rating')">
                <template v-if="category && comments === undefined">
                    <span class="flex items-center gap-1.5" :title="categoryLabel || $t('edit_clip.category')">
                        <IconFolder :size="14" class="text-current" /> <span style="color: var(--tf-accent-orange);">{{ typeof category.name === 'string' ? category.name : '' }}</span>
                    </span>
                </template>
                <template v-else>
                    <span 
                        class="flex items-center gap-1.5 transition-all" 
                        :class="[showRateSelect ? 'cursor-pointer hover:opacity-80 hover:scale-105 active:scale-95' : '']"
                        @click.prevent="showRateSelect ? $emit('open-rate-modal') : null"
                    >
                        <IconStar :size="14" class="text-current" /> 
                        <span style="color: var(--tf-accent-emerald);">{{ rating }}</span> 
                        <span style="opacity: 0.6">({{ ratingsCount }})</span>
                    </span>
                </template>
            </span>
        </div>
    </div>
</template>
