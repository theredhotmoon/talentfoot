<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useTranslation } from '../composables/useTranslation';
import TagPills from './TagPills.vue';
import IconDiamond from './icons/IconDiamond.vue';
import IconLightning from './icons/IconLightning.vue';
import ClipStatsGrid from './ClipStatsGrid.vue';
import RateClipModal from './RateClipModal.vue';
import CourseHowTo from './CourseHowTo.vue';
import type { Clip, Subclip, ActiveChallenge } from '../types';
import { computed, ref } from 'vue';
import api from '../api';

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
  (e: 'start-course'): void;
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

const showRateModal = ref(false);

const onRateSubmit = async (rating: number, clipId: string) => {
  showRateModal.value = false;
  if (!authStore.isAuthenticated) return;
  try {
    const response = await api.post<{ average_rating: number; ratings_count: number }>(`/api/clips/${clipId}/rate`, { rating });
    props.clip.average_rating = response.data.average_rating;
    props.clip.ratings_count = response.data.ratings_count;
    if (props.clip.current_user_rating) {
        props.clip.current_user_rating.rating = rating;
    } else {
        props.clip.current_user_rating = { rating: rating };
    }
  } catch {
    alert('Failed to rate clip');
  }
};
</script>

<template>
  <div class="card-static overflow-hidden order-3 mt-6" style="border-radius: var(--tf-radius-xl);">
    <div class="p-6">
      <!-- Title + challenge badge -->
      <div class="flex items-start gap-3 mb-2">
        <h1 class="text-3xl font-heading font-bold gradient-text">{{ getTranslated(clip.name) }}
            <div v-if="authStore.isAdmin" class="mt-4 flex right-end">
                <router-link :to="`/courses/${clip.id}/edit`" class="btn-ghost text-xs py-1.5 px-3 rounded-lg" style="border: 1px solid var(--tf-border);">
                    {{ $t('clip_detail.edit_clip') }}
                </router-link>
            </div>
        </h1>

        <!-- Completed badge -->
        <div v-if="authStore.isAuthenticated && activeChallenge?.is_completed" class="relative group flex-shrink-0 mt-1 ml-auto">
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
        <div v-else-if="authStore.isAuthenticated && activeChallenge && !activeChallenge.is_completed" class="relative group flex-shrink-0 mt-1 ml-auto">
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
      <div v-if="authStore.isAuthenticated && clip.subclips?.length && !subscriptionActive && authStore.showTips && !tipDismissed"
           class="mb-4 p-4 rounded-xl flex items-start gap-3" style="background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.2);">
        <IconDiamond :size="24" class="flex-shrink-0" style="color: var(--tf-accent-violet);" />
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm mb-1" style="color: var(--tf-accent-violet);">{{ $t('tips.subscribe_title') }}</p>
          <p class="text-xs" style="color: var(--tf-text-muted);">{{ $t('tips.subscribe_desc') }}</p>
        </div>
        <button @click="emit('dismiss-tip')" class="flex-shrink-0 text-xs px-2 py-1 rounded-lg transition-all hover:scale-105" style="color: var(--tf-text-dimmed); background: rgba(255,255,255,0.05);">✕</button>
      </div>

      <!-- Tip: Start challenge -->
      <div v-else-if="authStore.isAuthenticated && clip.subclips?.length && subscriptionActive && !activeChallenge && authStore.showTips && !tipDismissed"
           class="mb-4 p-4 rounded-xl flex items-start gap-3" style="background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2);">
        <IconLightning :size="24" class="flex-shrink-0" style="color: var(--tf-accent-amber);" />
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm mb-1" style="color: var(--tf-accent-amber);">{{ $t('tips.start_challenge_title') }}</p>
          <p class="text-xs" style="color: var(--tf-text-muted);">{{ $t('tips.start_challenge_desc') }}</p>
        </div>
        <button @click="emit('dismiss-tip')" class="flex-shrink-0 text-xs px-2 py-1 rounded-lg transition-all hover:scale-105" style="color: var(--tf-text-dimmed); background: rgba(255,255,255,0.05);">✕</button>
      </div>

      <!-- Course instructions (no challenge yet, tips dismissed) -->
      <CourseHowTo
        v-else-if="authStore.isAuthenticated && clip.subclips?.length && !activeChallenge"
        :main-clip-watched="mainClipWatched"
        :subscription-active="subscriptionActive"
        @start-course="emit('start-course')"
      />

      <!-- Main clip required (active challenge, main not watched) -->
      <!-- Needs to be restored but not here ?  -->
<!--      <div v-else-if="activeChallenge && !activeChallenge.is_completed && !mainClipWatched"-->
<!--           class="mb-4 p-4 rounded-xl" style="background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2);">-->
<!--        <p class="font-semibold text-sm mb-1 flex items-center gap-2" style="color: var(&#45;&#45;tf-accent-amber);">-->
<!--          <IconWarning :size="16" /> {{ $t('course.main_clip_required_title') }}-->
<!--        </p>-->
<!--        <p class="text-xs" style="color: var(&#45;&#45;tf-text-muted);">{{ $t('course.main_clip_required_msg') }}</p>-->
<!--      </div>-->


      <!-- Stats -->
<!--      <div class="flex flex-col w-full mt-4">-->
      <div class="flex flex-wrap justify-start">

<!--          <div class="flex flex-wrap justify-start">-->
              <div class="relative basis-1/2">
                  <TagPills v-if="clip.tags" :tags="clip.tags" />

              </div>
              <div class="relative basis-1/2">
                  <ClipStatsGrid
                      :difficulty="currentDifficulty"
                      :views="currentViews"
                      :comments="!activeSubclip ? commentsCount : undefined"
                      :rating="currentRating"
                      :ratings-count="currentRatingsCount"
                      :category="!activeSubclip ? clip.category : undefined"
                      :category-label="!activeSubclip && clip.category ? getTranslated(clip.category.name) : undefined"
                      :subclips-count="!activeSubclip ? clip.subclips_count : undefined"
                      :participants-count="!activeSubclip ? clip.challenges_count : undefined"
                      :completed-count="!activeSubclip ? clip.completed_challenges_count : undefined"
                      :show-rate-select="!activeSubclip"
                      @open-rate-modal="showRateModal = true"
                  />

                  <RateClipModal
                      v-if="showRateModal"
                      :initial-rating="clip.current_user_rating ? clip.current_user_rating.rating : 0"
                      @close="showRateModal = false"
                      @submit="onRateSubmit($event, clip.id)"
                  />

              </div>
<!--          </div>-->


      </div>
    </div>
  </div>
</template>
