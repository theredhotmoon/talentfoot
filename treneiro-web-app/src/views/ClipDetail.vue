<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '../api';
import { useAuthStore } from '../stores/auth';
import { useTranslation } from '../composables/useTranslation';
import { useChallenge } from '../composables/useChallenge';
import { useHead } from '@unhead/vue';
import { useToast } from '../composables/useToast';
import type { Clip, Comment, Subclip } from '../types';

// ── Components ─────────────────────────────────────────────────────────────
import ClipVideoPlayer from '../components/ClipVideoPlayer.vue';
import SubclipsSidebar from '../components/SubclipsSidebar.vue';
import SubclipsMobileStrip from '../components/SubclipsMobileStrip.vue';
import ClipInfo from '../components/ClipInfo.vue';
import ClipComments from '../components/ClipComments.vue';
import ChallengeProgressBar from '../components/ChallengeProgressBar.vue';
import SubscriptionRequiredModal from '../components/SubscriptionRequiredModal.vue';
import StartChallengeModal from '../components/StartChallengeModal.vue';
import WelcomeTourModal from '../components/WelcomeTourModal.vue';
import RegisterStartModal from '../components/RegisterStartModal.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const { getTranslated } = useTranslation();
const { showToast } = useToast();

const clipId = route.params.id as string;

// ── Core state ─────────────────────────────────────────────────────────────
const clip = ref<Clip | null>(null);
const comments = ref<Comment[]>([]);
const loading = ref(true);
const submittingComment = ref(false);
const activeSubclip = ref<Subclip | null>(null);
const subscriptionActive = ref(false);
const cartoonFilePath = ref<string | null>(null);
const tipDismissed = ref(false);
const showTour = ref(false);
const isGuestTour = ref(false);
const showRegisterStartModal = ref(false);

// ── Cover & Play Next state ───────────────────────────────────────────────
const coverDismissed = ref(false);
const showPlayNext = ref(false);
// True once the user fully watched the main clip before any challenge was started
const mainClipPrewatchedByUser = ref(false);

const GUEST_TOUR_LS_KEY = 'treneiro_guest_tour_dismissed';

// ── Challenge composable ───────────────────────────────────────────────────
const {
  activeChallenge,
  showChallengeModal,
  showSubRequiredModal,
  challengeStarting,
  startedSubclips,
  mainClipWatched,
  resetWatchTiming,
  canStartChallenge,
  MAX_ACTIVE_CHALLENGES,
  startChallenge,
  cancelChallenge,
  trySelectSubclip,
  fetchActiveChallengeCount,
  onVideoPlay,
  onVideoPause,
  onVideoEnded,
} = useChallenge(clipId, {
  onChallengeComplete: () => showToast({
    title: t('challenges.complete_title'),
    message: t('challenges.complete_message'),
    type: 'success',
    icon: '🏆',
    duration: 6000,
  }),
  onWatchError: () => showToast({
    title: t('challenges.watch_error_title'),
    message: t('challenges.watch_error_message'),
    type: 'error',
    icon: '⚠️',
    duration: 5000,
  }),
  onMainClipRequired: () => showToast({
    title: t('course.main_clip_required_title'),
    message: t('course.main_clip_required_msg'),
    type: 'warning',
    icon: '🎬',
    duration: 5000,
  }),
  onChallengeLimit: () => showToast({
    title: t('course.challenge_limit_title'),
    message: t('course.challenge_limit_message', { max: MAX_ACTIVE_CHALLENGES }),
    type: 'error',
    icon: '🚫',
    duration: 6000,
  }),
});

// ── Video player ref (for autoplay) ───────────────────────────────────────
const playerRef = ref<InstanceType<typeof ClipVideoPlayer> | null>(null);

// ── Computed helpers ───────────────────────────────────────────────────────
const mainClipWatchedComputed = computed(() =>
  mainClipWatched(clip.value).value,
);

const activeSubclipName = computed(() =>
  activeSubclip.value ? getTranslated(activeSubclip.value.name) : null,
);

const currentCaptions = computed<Record<string, string>>(() =>
  activeSubclip.value?.captions ?? clip.value?.captions ?? {},
);

const currentFilePath = computed(() =>
  activeSubclip.value?.file_path ?? clip.value?.file_path ?? '',
);

const isLockedSubclip = computed(() =>
  !!activeSubclip.value && !activeSubclip.value.is_preview,
);

const startedIds = computed(() => [...startedSubclips.value]);
const watchedIds = computed(() => activeChallenge.value?.watched_ids ?? []);

// Subclips available for preview (for logged-in users who haven't started a challenge)
const previewSubclips = computed(() => {
  if (!authStore.isAuthenticated) return [];
  if (activeChallenge.value) return []; // challenge started → not needed
  return (clip.value?.subclips ?? []).filter(s => s.is_preview);
});

// ── Cover overlay logic ────────────────────────────────────────────────────
const showCover = computed(() => {
  if (!clip.value?.subclips?.length) return false;
  if (coverDismissed.value) return false;
  // Show cover if no active challenge OR challenge is completed (let them re-watch freely after dismissing)
  const ch = activeChallenge.value;
  if (!ch) return true; // no challenge started → show cover
  if (ch.is_completed) return false; // completed → free play
  return false; // in progress → no cover
});

// ── Play Next logic ────────────────────────────────────────────────────────
const sortedSubclips = computed(() =>
  [...(clip.value?.subclips ?? [])].sort((a, b) => a.sort_order - b.sort_order),
);

const currentIndex = computed(() => {
  if (!activeSubclip.value) return -1; // main clip = -1
  return sortedSubclips.value.findIndex(s => s.id === activeSubclip.value!.id);
});

const nextItem = computed(() => {
  if (!clip.value?.subclips?.length) return null;
  const subs = sortedSubclips.value;

  if (!activeSubclip.value) {
    // Currently on main clip → next is first subclip
    const first = subs[0];
    return first ? { type: 'subclip' as const, subclip: first } : null;
  }

  const idx = currentIndex.value;
  if (idx >= 0 && idx < subs.length - 1) {
    const next = subs[idx + 1];
    return next ? { type: 'subclip' as const, subclip: next } : { type: 'none' as const };
  }

  return { type: 'none' as const }; // last item
});

const nextItemName = computed(() => {
  if (!nextItem.value || nextItem.value.type === 'none') return null;
  return getTranslated(nextItem.value.subclip.name);
});

const isLastItem = computed(() => {
  return nextItem.value?.type === 'none';
});

const isCourseComplete = computed(() => {
  return activeChallenge.value?.is_completed ?? false;
});

// ── SEO Head & Schema ──────────────────────────────────────────────────────
useHead({
  title: computed(() => clip.value ? getTranslated(clip.value.name) : 'Course Details'),
  meta: [
    {
      name: 'description',
      content: computed(() =>
        clip.value && clip.value.description
          ? getTranslated(clip.value.description).substring(0, 155)
          : 'Learn and master football skills with this premium course on TalentFoot.'
      )
    }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => {
        if (!clip.value) return '';
        return JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          "name": getTranslated(clip.value.name),
          "description": clip.value.description ? getTranslated(clip.value.description) : 'Master your football skills with premium video tutorials and challenges.',
          "provider": {
            "@type": "Organization",
            "name": "TalentFoot"
          }
        });
      })
    }
  ]
});

// ── Subclip navigation ─────────────────────────────────────────────────────
const doSwitchSubclip = (subclip: Subclip) => {
  activeSubclip.value = subclip;
  showPlayNext.value = false;
  resetWatchTiming();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const switchToMain = () => {
  activeSubclip.value = null;
  showPlayNext.value = false;
  resetWatchTiming();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSelectSubclip = (subclip: Subclip) => {
  trySelectSubclip(
    subclip,
    subscriptionActive.value,
    mainClipWatchedComputed.value,
    doSwitchSubclip,
  );
};

// ── Video events → challenge composable ───────────────────────────────────
const onPlay = () => {
  showPlayNext.value = false;
  onVideoPlay(activeSubclip.value, clip.value);
};
const onPause = () => onVideoPause();
const onEnded = () => {
  onVideoEnded(
    activeSubclip.value,
    clip.value,
    playerRef.value?.videoEl ?? null,
    mainClipWatchedComputed.value,
  );
  if (activeChallenge.value && !activeChallenge.value.is_completed) {
    // Challenge is active → show Play Next overlay
    if (clip.value?.subclips?.length) {
      showPlayNext.value = true;
    }
  } else {
    // No challenge (preview mode, guest, or completed) → restore the cover
    if (clip.value?.subclips?.length) {
      coverDismissed.value = false;
      // Mark main clip as pre-watched when the logged-in user finishes it before starting a challenge
      if (authStore.isAuthenticated && !activeSubclip.value) {
        mainClipPrewatchedByUser.value = true;
      }
    }
  }
};

// ── Cover overlay handlers ────────────────────────────────────────────────
const onWatchPreview = async () => {
  coverDismissed.value = true;
  await nextTick();
  playerRef.value?.videoEl?.play().catch(() => { /* browser may block */ });
};

const onStartCourse = async () => {
  if (!authStore.isAuthenticated) {
    showRegisterStartModal.value = true;
    return;
  }
  if (!subscriptionActive.value) {
    showSubRequiredModal.value = true;
    return;
  }
  // Check challenge limit
  await fetchActiveChallengeCount();
  if (!canStartChallenge.value) {
    showChallengeLimitToast.value = true;
    return;
  }
  // Start the challenge
  coverDismissed.value = true;
  startChallenge(async (pendingSubclip: Subclip | null) => {
    // If the user pre-watched the main clip, go straight to the first subclip
    const targetSubclip = pendingSubclip ?? (
      mainClipPrewatchedByUser.value && sortedSubclips.value.length
        ? sortedSubclips.value[0]
        : null
    );
    if (targetSubclip) {
      doSwitchSubclip(targetSubclip);
    }
    await nextTick();
    playerRef.value?.videoEl?.play().catch(() => { /* browser may block */ });
  }, mainClipPrewatchedByUser.value);
};

// ── Play Next handlers ────────────────────────────────────────────────────
const onPlayNext = async () => {
  showPlayNext.value = false;
  if (!nextItem.value || nextItem.value.type === 'none') return;
  doSwitchSubclip(nextItem.value.subclip);
  await nextTick();
  playerRef.value?.videoEl?.play().catch(() => {});
};

const onReplay = async () => {
  showPlayNext.value = false;
  const video = playerRef.value?.videoEl;
  if (video) {
    video.currentTime = 0;
    video.play().catch(() => {});
  }
};

const onDismissPlayNext = () => {
  showPlayNext.value = false;
};

// ── SubscriptionRequired modal close + auto-start ─────────────────────────
const onSubRequiredClose = async () => {
  showSubRequiredModal.value = false;
  // If user renewed subscription while in the modal, auto-start
  if (subscriptionActive.value && authStore.isAuthenticated) {
    // Re-fetch clip to get updated subscription status
    await fetchClip();
    if (subscriptionActive.value) {
      onStartCourse();
    }
  }
};

// ── API calls ──────────────────────────────────────────────────────────────
const fetchClip = async () => {
  try {
    const response = await api.get<{
      clip: Clip;
      subscription_active: boolean;
      cartoon_file_path: string | null;
      active_challenge: typeof activeChallenge.value;
    }>(`/api/clips/${clipId}`);
    clip.value = response.data.clip;
    subscriptionActive.value = response.data.subscription_active;
    cartoonFilePath.value = response.data.cartoon_file_path;
    activeChallenge.value = response.data.active_challenge ?? null;
  } catch {
    showToast({ title: 'Error', message: t('clip_detail.load_error'), type: 'error' });
  }
};

const fetchComments = async () => {
  const response = await api.get<Comment[]>(`/api/clips/${clipId}/comments`);
  comments.value = response.data;
};

const submitComment = async (content: string) => {
  submittingComment.value = true;
  try {
    const response = await api.post<Comment>(`/api/clips/${clipId}/comments`, { content });
    comments.value.unshift(response.data);
  } catch {
    showToast({ title: 'Error', message: 'Failed to post comment', type: 'error' });
  } finally {
    submittingComment.value = false;
  }
};

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([fetchClip(), fetchComments()]);
  } finally {
    loading.value = false;
  }

  if (route.query.autoplay) {
    coverDismissed.value = true;
    await nextTick();
    playerRef.value?.videoEl?.play().catch(() => { /* browser may block autoplay */ });
  }
});

// ── Welcome Tour Logic ─────────────────────────────────────────────────────
watch(() => authStore.isInitialized, (initialized) => {
  if (!initialized || showTour.value) return;

  if (authStore.isAuthenticated) {
    if (authStore.showTips) {
      isGuestTour.value = false;
      showTour.value = true;
    }
  } else {
    const dismissed = localStorage.getItem(GUEST_TOUR_LS_KEY);
    if (!dismissed) {
      isGuestTour.value = true;
      showTour.value = true;
    }
  }
}, { immediate: true });

</script>

<template>
  <div>
    <!-- Welcome Tour -->
    <WelcomeTourModal v-if="showTour" :is-guest="isGuestTour" @close="showTour = false" />

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16" style="color: var(--tf-text-muted);">
      <div class="w-8 h-8 rounded-full mx-auto mb-3 animate-spin" style="border: 3px solid var(--tf-border); border-top-color: var(--tf-accent-emerald);"></div>
      {{ $t('clip_detail.loading') }}
    </div>

    <div v-else-if="clip">
      <!-- Video + subclips row (side-by-side on desktop) -->
      <div :class="['mb-6', clip.subclips?.length ? 'lg:flex lg:gap-4 lg:items-start' : '']">

        <!-- Left column: video player + mobile strip + clip info -->
        <div :class="[clip.subclips?.length ? 'lg:flex-1 lg:min-w-0 flex flex-col lg:block' : '']">

          <ClipVideoPlayer
            ref="playerRef"
            :file-path="currentFilePath"
            :cartoon-file-path="cartoonFilePath"
            :captions="currentCaptions"
            :active-subclip-name="activeSubclipName"
            :has-subclips="!!clip.subclips?.length"
            :subscription-active="subscriptionActive"
            :is-locked-subclip="isLockedSubclip"
            :clip-name="getTranslated(clip.name)"
            :clip-description="clip.description ? getTranslated(clip.description) : ''"
            :show-cover="showCover"
            :show-play-next="showPlayNext"
            :next-item-name="nextItemName"
            :is-last-item="isLastItem"
            :is-course-complete="isCourseComplete"
            :auto-play-delay="authStore.autoPlayDelay"
            :subclips-count="clip.subclips_count ?? clip.subclips?.length ?? 0"
            :difficulty="clip.difficulty"
            :preview-subclips="previewSubclips"
            @play="onPlay"
            @pause="onPause"
            @ended="onEnded"
            @watch-preview="onWatchPreview"
            @start-course="onStartCourse"
            @play-next="onPlayNext"
            @replay="onReplay"
            @dismiss-play-next="onDismissPlayNext"
            @select-subclip="handleSelectSubclip"
          />

          <SubclipsMobileStrip
            v-if="clip.subclips?.length"
            :clip="clip"
            :active-subclip-id="activeSubclip?.id ?? null"
            :watched-ids="watchedIds"
            :started-ids="startedIds"
            :main-clip-watched="mainClipWatchedComputed"
            @select-main="switchToMain"
            @select-subclip="handleSelectSubclip"
          />

          <!-- Clip info panel -->
          <ClipInfo
            :clip="clip"
            :active-challenge="activeChallenge"
            :active-subclip="activeSubclip"
            :subscription-active="subscriptionActive"
            :main-clip-watched="mainClipWatchedComputed"
            :comments-count="clip.comments_count ?? comments.length"
            :tip-dismissed="tipDismissed"
            @dismiss-tip="tipDismissed = true"
            @start-course="onStartCourse"
          />
          <!-- Comments -->
          <ClipComments
            :comments="comments"
            :submitting="submittingComment"
            @submit="submitComment"
          />
        </div>

        <!-- Right column: desktop sidebar (hidden on mobile) -->
        <SubclipsSidebar
          v-if="clip.subclips?.length"
          :clip="clip"
          :active-subclip-id="activeSubclip?.id ?? null"
          :watched-ids="watchedIds"
          :started-ids="startedIds"
          :main-clip-watched="mainClipWatchedComputed"
          @select-main="switchToMain"
          @select-subclip="handleSelectSubclip"
        />
      </div>
    </div>

    <div v-else class="text-center mt-10">{{ $t('clip_detail.not_found') }}</div>

    <!-- Fixed challenge progress bar -->
    <ChallengeProgressBar
      v-if="activeChallenge && !activeChallenge.is_completed && clip"
      :challenge="activeChallenge"
    />

    <!-- Subscription Required Modal -->
    <SubscriptionRequiredModal
      v-if="showSubRequiredModal"
      @close="onSubRequiredClose"
    />

    <!-- Start Challenge Modal (subscribed user clicks a locked subclip before starting a challenge) -->
    <StartChallengeModal
      v-if="showChallengeModal"
      :loading="challengeStarting"
      @confirm="onStartCourse"
      @cancel="cancelChallenge"
    />

    <!-- Register + Start Modal (for unauthenticated users) -->
    <RegisterStartModal
      v-if="showRegisterStartModal"
      :clip="clip"
      @close="showRegisterStartModal = false"
    />
  </div>
</template>
