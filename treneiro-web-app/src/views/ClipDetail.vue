<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '../api';
import { useAuthStore } from '../stores/auth';
import { useTranslation } from '../composables/useTranslation';
import { useChallenge } from '../composables/useChallenge';
import { useHead } from '@unhead/vue';
import type { Clip, Comment, Subclip } from '../types';

// ── Components ─────────────────────────────────────────────────────────────
import ClipVideoPlayer from '../components/ClipVideoPlayer.vue';
import SubclipsSidebar from '../components/SubclipsSidebar.vue';
import SubclipsMobileStrip from '../components/SubclipsMobileStrip.vue';
import ClipInfo from '../components/ClipInfo.vue';
import ClipComments from '../components/ClipComments.vue';
import ChallengeProgressBar from '../components/ChallengeProgressBar.vue';
import StartCourseModal from '../components/StartCourseModal.vue';
import SubscriptionRequiredModal from '../components/SubscriptionRequiredModal.vue';
import WelcomeTourModal from '../components/WelcomeTourModal.vue';

const { } = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const { getTranslated } = useTranslation();

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

const GUEST_TOUR_LS_KEY = 'treneiro_guest_tour_dismissed';

// ── Challenge composable ───────────────────────────────────────────────────
const challenge = useChallenge(clipId);

// ── Video player ref (for autoplay) ───────────────────────────────────────
const playerRef = ref<InstanceType<typeof ClipVideoPlayer> | null>(null);

// ── Computed helpers ───────────────────────────────────────────────────────
const mainClipWatchedComputed = computed(() =>
  challenge.mainClipWatched(clip.value).value,
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

const startedIds = computed(() => [...challenge.startedSubclips.value]);
const watchedIds = computed(() => challenge.activeChallenge.value?.watched_ids ?? []);

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
  challenge.resetWatchTiming();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const switchToMain = () => {
  activeSubclip.value = null;
  challenge.resetWatchTiming();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSelectSubclip = (subclip: Subclip) => {
  challenge.trySelectSubclip(
    subclip,
    subscriptionActive.value,
    mainClipWatchedComputed.value,
    doSwitchSubclip,
  );
};

// ── Video events → challenge composable ───────────────────────────────────
const onPlay = () => challenge.onVideoPlay(activeSubclip.value, clip.value);
const onPause = () => challenge.onVideoPause();
const onEnded = () =>
  challenge.onVideoEnded(
    activeSubclip.value,
    clip.value,
    playerRef.value?.videoEl ?? null,
    mainClipWatchedComputed.value,
  );

// ── API calls ──────────────────────────────────────────────────────────────
const fetchClip = async () => {
  const response = await api.get<{
    clip: Clip;
    subscription_active: boolean;
    cartoon_file_path: string | null;
    active_challenge: typeof challenge.activeChallenge.value;
  }>(`/api/clips/${clipId}`);
  clip.value = response.data.clip;
  subscriptionActive.value = response.data.subscription_active;
  cartoonFilePath.value = response.data.cartoon_file_path;
  challenge.activeChallenge.value = response.data.active_challenge ?? null;
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
    alert('Failed to post comment');
  } finally {
    submittingComment.value = false;
  }
};

// ── Challenge actions ──────────────────────────────────────────────────────
const onConfirmStartChallenge = () => {
  challenge.startChallenge((pendingSubclip) => {
    if (pendingSubclip) doSwitchSubclip(pendingSubclip);
  });
};

const onStartCourse = () => {
  if (!subscriptionActive.value) {
    challenge.showSubRequiredModal.value = true;
    return;
  }
  challenge.showChallengeModal.value = true;
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
    await nextTick();
    playerRef.value?.videoEl?.play().catch(() => { /* browser may block autoplay */ });
  }
});

// ── Welcome Tour Logic ─────────────────────────────────────────────────────
// Watch for auth initialization to avoid showing the tour before we know the user's preference
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
            @play="onPlay"
            @pause="onPause"
            @ended="onEnded"
            @back-to-main="switchToMain"
          />

          <!-- Mobile subclip strip (hidden on desktop) -->
          <SubclipsMobileStrip
            v-if="clip.subclips?.length"
            :clip="clip"
            :active-subclip-id="activeSubclip?.id ?? null"
            :watched-ids="watchedIds"
            :started-ids="startedIds"
            @select-main="switchToMain"
            @select-subclip="handleSelectSubclip"
          />

          <!-- Clip info panel -->
          <ClipInfo
            :clip="clip"
            :active-challenge="challenge.activeChallenge.value"
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
          @select-main="switchToMain"
          @select-subclip="handleSelectSubclip"
        />
      </div>
    </div>

    <div v-else class="text-center mt-10">{{ $t('clip_detail.not_found') }}</div>

    <!-- Fixed challenge progress bar -->
    <ChallengeProgressBar
      v-if="challenge.activeChallenge.value && !challenge.activeChallenge.value.is_completed && clip"
      :challenge="challenge.activeChallenge.value"
    />

    <!-- Start Course Modal -->
    <StartCourseModal
      v-if="challenge.showChallengeModal.value"
      :loading="challenge.challengeStarting.value"
      @confirm="onConfirmStartChallenge"
      @cancel="challenge.cancelChallenge()"
    />

    <!-- Subscription Required Modal -->
    <SubscriptionRequiredModal
      v-if="challenge.showSubRequiredModal.value"
      @close="challenge.showSubRequiredModal.value = false"
    />

    <!-- Challenge Complete Toast -->
    <transition name="slide-up">
      <div v-if="challenge.showChallengeCompleteToast.value"
           class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl text-center"
           style="background: var(--tf-gradient-primary); color: #0f0e17; box-shadow: 0 8px 32px rgba(16,185,129,0.4);">
        <div class="text-3xl mb-1">🏆</div>
        <p class="font-heading font-bold">{{ $t('challenges.complete_title') }}</p>
        <p class="text-xs opacity-75">{{ $t('challenges.complete_message') }}</p>
      </div>
    </transition>

    <!-- Watch Duration Error Toast -->
    <transition name="slide-up">
      <div v-if="challenge.showWatchErrorToast.value"
           class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl text-center"
           style="background: rgba(239,68,68,0.9); color: white; box-shadow: 0 8px 32px rgba(239,68,68,0.4);">
        <div class="text-3xl mb-1">⚠️</div>
        <p class="font-heading font-bold">{{ $t('challenges.watch_error_title') }}</p>
        <p class="text-xs opacity-85">{{ $t('challenges.watch_error_message') }}</p>
      </div>
    </transition>

    <!-- Main Clip Required Toast -->
    <transition name="slide-up">
      <div v-if="challenge.showMainClipRequiredToast.value"
           class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl text-center"
           style="background: rgba(251,191,36,0.9); color: #0f0e17; box-shadow: 0 8px 32px rgba(251,191,36,0.4);">
        <div class="text-3xl mb-1">🎬</div>
        <p class="font-heading font-bold">{{ $t('course.main_clip_required_title') }}</p>
        <p class="text-xs opacity-85">{{ $t('course.main_clip_required_msg') }}</p>
      </div>
    </transition>
  </div>
</template>
