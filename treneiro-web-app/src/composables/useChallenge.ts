import { ref, computed } from 'vue';
import { useTimeoutFn } from '@vueuse/core';
import api from '../api';
import type { ActiveChallenge, Clip, Subclip } from '../types';

/**
 * Encapsulates all challenge-related state and watch-tracking logic
 * for the ClipDetail view.
 *
 * @param clipId - the current clip's id (used for the POST /api/challenges)
 */
export function useChallenge(clipId: string) {
  // ── Challenge state ────────────────────────────────────────────────────
  const activeChallenge = ref<ActiveChallenge | null>(null);
  const showChallengeModal = ref(false);
  const showSubRequiredModal = ref(false);
  const showChallengeCompleteToast = ref(false);
  const showWatchErrorToast = ref(false);
  const showMainClipRequiredToast = ref(false);
  const pendingSubclip = ref<Subclip | null>(null);
  const challengeStarting = ref(false);

  // ── Watch timing state ─────────────────────────────────────────────────
  const watchStartedAt = ref<number | null>(null);
  const accumulatedWatchTime = ref(0);
  const startedSubclips = ref<Set<string>>(new Set());

  // ── Toast auto-dismiss ─────────────────────────────────────────────────
  const { start: dismissCompleteToast } = useTimeoutFn(
    () => { showChallengeCompleteToast.value = false; },
    6000,
    { immediate: false },
  );
  const { start: dismissWatchErrorToast } = useTimeoutFn(
    () => { showWatchErrorToast.value = false; },
    5000,
    { immediate: false },
  );
  const { start: dismissMainClipToast } = useTimeoutFn(
    () => { showMainClipRequiredToast.value = false; },
    5000,
    { immediate: false },
  );

  // ── Computed helpers ───────────────────────────────────────────────────
  const mainClipWatched = (clip: Clip | null) =>
    computed(() => {
      if (!activeChallenge.value || !clip) return false;
      return (activeChallenge.value.watched_ids ?? []).includes(clip.id);
    });

  const isSubclipWatched = (id: string) =>
    (activeChallenge.value?.watched_ids ?? []).includes(id);

  const isSubclipStarted = (id: string) =>
    startedSubclips.value.has(id) && !isSubclipWatched(id);

  // ── Timing helpers ─────────────────────────────────────────────────────
  const resetWatchTiming = () => {
    watchStartedAt.value = null;
    accumulatedWatchTime.value = 0;
  };

  // ── API calls ──────────────────────────────────────────────────────────
  const startChallenge = async (onSuccess: (subclip: Subclip | null) => void) => {
    challengeStarting.value = true;
    try {
      const res = await api.post<{ challenge: ActiveChallenge }>('/api/challenges', {
        clip_id: clipId,
      });
      activeChallenge.value = res.data.challenge;
      showChallengeModal.value = false;
      onSuccess(pendingSubclip.value);
      pendingSubclip.value = null;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { challenge?: ActiveChallenge } } };
      if (err.response?.data?.challenge) {
        activeChallenge.value = err.response.data.challenge;
      }
      console.error('Failed to start challenge', e);
    } finally {
      challengeStarting.value = false;
    }
  };

  const recordChallengeWatch = async (type: string, watchableId: string) => {
    if (!activeChallenge.value) return;
    try {
      const res = await api.post<{ challenge: ActiveChallenge }>(
        `/api/challenges/${activeChallenge.value.id}/watch`,
        { watchable_type: type, watchable_id: watchableId },
      );
      activeChallenge.value = res.data.challenge;
      if (res.data.challenge.is_completed) {
        showChallengeCompleteToast.value = true;
        dismissCompleteToast();
      }
    } catch (e) {
      console.error('Failed to record challenge watch', e);
    }
  };

  // ── Video event handlers ───────────────────────────────────────────────
  const onVideoPlay = (activeSubclip: Subclip | null, clip: Clip | null) => {
    if (activeSubclip && !startedSubclips.value.has(activeSubclip.id)) {
      startedSubclips.value.add(activeSubclip.id);
    }
    const currentId = activeSubclip ? activeSubclip.id : clip?.id;
    if (currentId) startedSubclips.value.add(currentId);
    if (watchStartedAt.value === null) {
      watchStartedAt.value = Date.now();
    }
  };

  const onVideoPause = () => {
    if (watchStartedAt.value !== null) {
      accumulatedWatchTime.value += (Date.now() - watchStartedAt.value) / 1000;
      watchStartedAt.value = null;
    }
  };

  const onVideoEnded = (
    activeSubclip: Subclip | null,
    clip: Clip | null,
    videoElement: HTMLVideoElement | null,
    mainClipIsWatched: boolean,
  ) => {
    if (!activeChallenge.value || activeChallenge.value.is_completed) return;

    const type = activeSubclip ? 'subclip' : 'clip';
    const wId = activeSubclip ? activeSubclip.id : clip?.id;
    const watchedIds = activeChallenge.value.watched_ids ?? [];

    if (!wId || watchedIds.includes(wId)) return;

    if (type === 'subclip' && !mainClipIsWatched) {
      showMainClipRequiredToast.value = true;
      dismissMainClipToast();
      return;
    }

    // Validate watch duration >= ~95% of video length across pause/resume cycles
    if (videoElement) {
      const currentSegment = watchStartedAt.value
        ? (Date.now() - watchStartedAt.value) / 1000
        : 0;
      const totalWatched = accumulatedWatchTime.value + currentSegment;
      if (videoElement.duration && totalWatched < videoElement.duration * 0.95) {
        showWatchErrorToast.value = true;
        dismissWatchErrorToast();
        return;
      }
    }

    resetWatchTiming();
    recordChallengeWatch(type, wId);
  };

  // ── Subclip access control ─────────────────────────────────────────────
  const trySelectSubclip = (
    subclip: Subclip,
    subscriptionActive: boolean,
    mainClipIsWatched: boolean,
    onSelect: (s: Subclip) => void,
  ) => {
    if (subclip.is_preview) {
      onSelect(subclip);
      return;
    }
    if (activeChallenge.value && !activeChallenge.value.is_completed) {
      if (!mainClipIsWatched) {
        showMainClipRequiredToast.value = true;
        dismissMainClipToast();
        return;
      }
      onSelect(subclip);
      return;
    }
    if (activeChallenge.value?.is_completed && subscriptionActive) {
      onSelect(subclip);
      return;
    }
    if (!subscriptionActive) {
      showSubRequiredModal.value = true;
      return;
    }
    pendingSubclip.value = subclip;
    showChallengeModal.value = true;
  };

  const cancelChallenge = () => {
    showChallengeModal.value = false;
    pendingSubclip.value = null;
  };

  return {
    // State
    activeChallenge,
    showChallengeModal,
    showSubRequiredModal,
    showChallengeCompleteToast,
    showWatchErrorToast,
    showMainClipRequiredToast,
    challengeStarting,
    startedSubclips,
    watchStartedAt,
    accumulatedWatchTime,
    // Helpers
    mainClipWatched,
    isSubclipWatched,
    isSubclipStarted,
    resetWatchTiming,
    // Actions
    startChallenge,
    cancelChallenge,
    trySelectSubclip,
    // Video handlers
    onVideoPlay,
    onVideoPause,
    onVideoEnded,
  };
}
