<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useTranslation } from '../composables/useTranslation';
import TagPills from './TagPills.vue';
import IconDiamond from './icons/IconDiamond.vue';
import IconLightning from './icons/IconLightning.vue';
import IconBook from './icons/IconBook.vue';
import IconPlayMovie from './icons/IconPlayMovie.vue';
import IconEye from './icons/IconEye.vue';
import IconCheck from './icons/IconCheck.vue';
import IconWarning from './icons/IconWarning.vue';
import IconStar from './icons/IconStar.vue';
import IconFlame from './icons/IconFlame.vue';
import IconMessage from './icons/IconMessage.vue';
import IconFolder from './icons/IconFolder.vue';
import IconUsers from './icons/IconUsers.vue';
import type { Clip, Subclip, ActiveChallenge } from '../types';
import { computed } from 'vue';

const props = defineProps<{
  clip: Clip;
  activeChallenge: ActiveChallenge | null;
  activeSubclip: Subclip | null;
  subscriptionActive: boolean;
  mainClipWatched: boolean;
  commentsCount: number;
  tipDismissed: boolean;
}>();

const emit = defineEmits<{
  (e: 'dismiss-tip'): void;
}>();

const authStore = useAuthStore();
const { getTranslated } = useTranslation();

const currentViews = computed(() => props.activeSubclip?.views ?? props.clip.views);
const currentDifficulty = computed(() => props.activeSubclip?.difficulty ?? props.clip.difficulty);
const currentRating = computed(() => {
  const r = props.activeSubclip?.average_rating ?? props.clip.average_rating;
  return r ? Number(r).toFixed(1) : '-';
});
const currentRatingsCount = computed(() =>
  props.activeSubclip?.ratings_count ?? props.clip.ratings_count,
);
</script>

<template>
  <div class="card-static overflow-hidden order-3 mt-6" style="border-radius: var(--tf-radius-xl);">
    <div class="p-6">
      <!-- Title + challenge badge -->
      <div class="flex items-start gap-3 mb-2">
        <h1 class="text-3xl font-heading font-bold gradient-text">{{ getTranslated(clip.name) }}</h1>

        <!-- Completed badge -->
        <div v-if="activeChallenge?.is_completed" class="relative group flex-shrink-0 mt-1 ml-auto">
          <div class="w-9 h-9 rounded-full flex items-center justify-center cursor-help" style="background: rgba(110,231,183,0.15); border: 2px solid var(--tf-accent-emerald);">
            <span class="text-lg">🏆</span>
          </div>
          <div class="absolute right-0 top-full mt-2 px-4 py-3 rounded-xl text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50" style="background: var(--tf-bg-surface-solid); border: 1px solid var(--tf-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
            <p class="font-bold mb-1" style="color: var(--tf-accent-emerald);">{{ $t('challenges.complete_title') }}</p>
            <p style="color: var(--tf-text-muted);">{{ $t('challenges.finished') }}: {{ new Date(activeChallenge.finished_at!).toLocaleDateString() }}</p>
            <p v-if="activeChallenge.duration" style="color: var(--tf-text-muted);">{{ $t('challenges.duration') }}: {{ activeChallenge.duration }}</p>
          </div>
        </div>

        <!-- In-progress badge -->
        <div v-else-if="activeChallenge && !activeChallenge.is_completed" class="relative group flex-shrink-0 mt-1 ml-auto">
          <div class="w-9 h-9 rounded-full flex items-center justify-center cursor-help" style="background: rgba(251,191,36,0.15); border: 2px solid var(--tf-accent-amber);">
            <span class="text-lg">⚡</span>
          </div>
          <div class="absolute right-0 top-full mt-2 px-4 py-3 rounded-xl text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50" style="background: var(--tf-bg-surface-solid); border: 1px solid var(--tf-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
            <p class="font-bold mb-1" style="color: var(--tf-accent-amber);">{{ $t('challenges.in_progress') }}</p>
            <p style="color: var(--tf-text-muted);">{{ $t('challenges.progress') }}: {{ activeChallenge.watched_items }}/{{ activeChallenge.total_items }}</p>
            <p style="color: var(--tf-text-muted);">{{ $t('challenges.started') }}: {{ new Date(activeChallenge.started_at).toLocaleDateString() }}</p>
          </div>
        </div>
      </div>

      <p class="mb-4" style="color: var(--tf-text-muted);">{{ getTranslated(clip.description) }}</p>

      <!-- Contextual tip: Subscribe to unlock -->
      <div v-if="clip.subclips?.length && !subscriptionActive && authStore.showTips && !tipDismissed"
           class="mb-4 p-4 rounded-xl flex items-start gap-3" style="background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.2);">
        <IconDiamond :size="24" class="flex-shrink-0" style="color: var(--tf-accent-violet);" />
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm mb-1" style="color: var(--tf-accent-violet);">{{ $t('tips.subscribe_title') }}</p>
          <p class="text-xs" style="color: var(--tf-text-muted);">{{ $t('tips.subscribe_desc') }}</p>
        </div>
        <button @click="emit('dismiss-tip')" class="flex-shrink-0 text-xs px-2 py-1 rounded-lg transition-all hover:scale-105" style="color: var(--tf-text-dimmed); background: rgba(255,255,255,0.05);">✕</button>
      </div>

      <!-- Tip: Start challenge -->
      <div v-else-if="clip.subclips?.length && subscriptionActive && !activeChallenge && authStore.showTips && !tipDismissed"
           class="mb-4 p-4 rounded-xl flex items-start gap-3" style="background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2);">
        <IconLightning :size="24" class="flex-shrink-0" style="color: var(--tf-accent-amber);" />
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm mb-1" style="color: var(--tf-accent-amber);">{{ $t('tips.start_challenge_title') }}</p>
          <p class="text-xs" style="color: var(--tf-text-muted);">{{ $t('tips.start_challenge_desc') }}</p>
        </div>
        <button @click="emit('dismiss-tip')" class="flex-shrink-0 text-xs px-2 py-1 rounded-lg transition-all hover:scale-105" style="color: var(--tf-text-dimmed); background: rgba(255,255,255,0.05);">✕</button>
      </div>

      <!-- Course instructions (no challenge yet, tips dismissed) -->
      <div v-else-if="clip.subclips?.length && !activeChallenge"
           class="mb-4 p-4 rounded-xl" style="background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2);">
        <p class="font-semibold text-sm mb-2 flex items-center gap-2" style="color: var(--tf-accent-violet);">
          <IconBook :size="16" /> {{ $t('course.how_it_works') }}
        </p>
        <ul class="text-xs space-y-2" style="color: var(--tf-text-muted);">
          <li class="flex items-center gap-2"><IconPlayMovie :size="14" /> {{ $t('course.step_watch_main') }}</li>
          <li class="flex items-center gap-2"><IconEye :size="14" /> {{ $t('course.step_preview') }}</li>
          <li class="flex items-center gap-2"><IconLightning :size="14" /> {{ $t('course.step_start') }}</li>
          <li class="flex items-center gap-2"><IconCheck :size="14" /> {{ $t('course.step_complete') }}</li>
        </ul>
      </div>

      <!-- Main clip required (active challenge, main not watched) -->
      <div v-else-if="activeChallenge && !activeChallenge.is_completed && !mainClipWatched"
           class="mb-4 p-4 rounded-xl" style="background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2);">
        <p class="font-semibold text-sm mb-1 flex items-center gap-2" style="color: var(--tf-accent-amber);">
          <IconWarning :size="16" /> {{ $t('course.main_clip_required_title') }}
        </p>
        <p class="text-xs" style="color: var(--tf-text-muted);">{{ $t('course.main_clip_required_msg') }}</p>
      </div>

      <TagPills v-if="clip.tags" :tags="clip.tags" />

      <!-- Stats -->
      <div class="flex flex-col gap-2 w-full text-sm mt-3" style="color: var(--tf-text-muted);">
        <!-- Line 1 -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span class="stat-badge flex items-center gap-1.5"><IconEye :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-cyan);">{{ currentViews }}</span></span>
          <span class="text-gray-600 font-bold opacity-30">•</span>
          <span class="stat-badge flex items-center gap-1.5"><IconFlame :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-amber);">{{ currentDifficulty }}/10</span></span>

          <template v-if="!activeSubclip">
            <span class="text-gray-600 font-bold opacity-30">•</span>
            <span class="stat-badge flex items-center gap-1.5"><IconMessage :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-violet);">{{ commentsCount }}</span></span>
          </template>

          <div class="flex-1"></div>
          <router-link v-if="authStore.isAdmin" :to="`/clips/${clip.id}/edit`" class="btn-ghost text-xs py-1 px-3">
            {{ $t('clip_detail.edit_clip') }}
          </router-link>
        </div>

        <!-- Line 2 -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <template v-if="!activeSubclip && clip.challenges_count !== undefined">
            <span class="stat-badge flex items-center gap-1.5 cursor-help" :title="`${clip.challenges_count} ${$t('dashboard.participants')}. ${clip.completed_challenges_count || 0} ${$t('clip_detail.completed') || 'completed'}.`">
              <IconUsers :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-cyan);">{{ clip.challenges_count }}</span>
            </span>
            <span class="text-gray-600 font-bold opacity-30">•</span>
          </template>

          <template v-if="!activeSubclip && clip.subclips_count !== undefined">
            <span class="stat-badge flex items-center gap-1.5">
              <IconBook :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-violet);">{{ clip.subclips_count }}</span>
            </span>
            <span class="text-gray-600 font-bold opacity-30">•</span>
          </template>

          <span class="stat-badge flex items-center gap-1.5">
            <IconStar :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-emerald);">{{ currentRating }}/10</span>
            <span style="opacity:0.6; font-size: 0.9em;">({{ currentRatingsCount }} {{ $t('clip_detail.votes') }})</span>
          </span>

          <template v-if="clip.category">
            <span class="text-gray-600 font-bold opacity-30">•</span>
            <span class="stat-badge flex items-center gap-1.5">
              <IconFolder :size="14" class="text-current" /> <span class="stat-value" style="color: var(--tf-accent-orange);">{{ getTranslated(clip.category.name) }}</span>
            </span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
