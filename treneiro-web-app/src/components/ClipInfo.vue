<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useTranslation } from '../composables/useTranslation';
import TagPills from './TagPills.vue';
import ClipStatsGrid from './ClipStatsGrid.vue';
import RateClipModal from './RateClipModal.vue';
import LoginToRateModal from './LoginToRateModal.vue';
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

const currentViews = computed(() => props.clip.views);
const currentDifficulty = computed(() => props.clip.difficulty);
const currentRating = computed(() => {
  const r = props.clip.average_rating;
  return r ? Number(r).toFixed(1) : '-';
});
const currentRatingsCount = computed(() =>
  props.clip.ratings_count,
);

const showRateModal = ref(false);
const showLoginToRateModal = ref(false);

const onOpenRateModal = () => {
  if (authStore.isAuthenticated) {
    showRateModal.value = true;
  } else {
    showLoginToRateModal.value = true;
  }
};

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
      <!-- Two-column layout: content (66%) | stats + tags (33%) -->
      <div class="clip-info-columns">

        <!-- LEFT COLUMN: Title, description, tips -->
        <div class="clip-info-content">
          <!-- Admin edit + challenge badge row -->
          <div class="flex items-center gap-3 mb-2">
            <div v-if="authStore.isAdmin">
                <router-link :to="`/courses/${clip.id}/edit`" class="btn-ghost text-xs py-1.5 px-3 rounded-lg" style="border: 1px solid var(--tf-border);">
                    {{ $t('clip_detail.edit_clip') }}
                </router-link>
            </div>

            <!-- Completed badge -->
            <div v-if="authStore.isAuthenticated && activeChallenge?.is_completed" class="relative group flex-shrink-0 ml-auto">
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
            <div v-else-if="authStore.isAuthenticated && activeChallenge && !activeChallenge.is_completed" class="relative group flex-shrink-0 ml-auto">
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
        </div>

        <!-- RIGHT COLUMN: Stats icons + tags -->
        <div class="clip-info-sidebar">
          <div class="clip-info-sidebar-inner">
            <ClipStatsGrid
                :difficulty="currentDifficulty"
                :views="currentViews"
                :comments="commentsCount"
                :rating="currentRating"
                :ratings-count="currentRatingsCount"
                :category="clip.category"
                :category-label="clip.category ? getTranslated(clip.category.name) : undefined"
                :subclips-count="clip.subclips_count"
                :participants-count="clip.challenges_count"
                :completed-count="clip.completed_challenges_count"
                :show-rate-select="true"
                @open-rate-modal="onOpenRateModal"
            />

            <!-- Divider -->
            <div class="clip-info-sidebar-divider"></div>

            <!-- Tags below stats -->
            <TagPills v-if="clip.tags" :tags="clip.tags" />
          </div>

          <RateClipModal
              v-if="showRateModal && authStore.isAuthenticated"
              :initial-rating="clip.current_user_rating ? clip.current_user_rating.rating : 0"
              @close="showRateModal = false"
              @submit="onRateSubmit($event, clip.id)"
          />

          <LoginToRateModal
              v-if="showLoginToRateModal && !authStore.isAuthenticated"
              @close="showLoginToRateModal = false"
          />
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.clip-info-columns {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.clip-info-content {
  flex: 2;
  min-width: 0;
}

.clip-info-sidebar {
  flex: 1;
  min-width: 0;
}

.clip-info-sidebar-inner {
  padding: 1rem 1.25rem;
  border-radius: var(--tf-radius-lg, 12px);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--tf-border);
}

.clip-info-sidebar-divider {
  height: 1px;
  margin: 0.75rem 0;
  background: linear-gradient(
    90deg,
    transparent,
    var(--tf-border) 20%,
    var(--tf-border) 80%,
    transparent
  );
}

/* Mobile: stack vertically */
@media (max-width: 768px) {
  .clip-info-columns {
    flex-direction: column;
  }

  .clip-info-sidebar {
    width: 100%;
    order: -1;
  }
}
</style>
