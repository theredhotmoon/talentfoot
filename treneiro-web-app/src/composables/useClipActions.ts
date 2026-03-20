import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import type { Clip, Challenge } from '../types';

/**
 * Shared clip interaction logic: rating and challenge management.
 *
 * Used by Dashboard, TagDetail, and CategoryDetail to avoid duplicating
 * the same startChallengeForClip / handleRate implementation.
 *
 * @param clips    - reactive list of clips whose rating fields should be updated in-place
 * @param challenges - reactive list of challenges to push newly created challenges into
 */
export function useClipActions(
  clips: Ref<Clip[]>,
  challenges: Ref<Challenge[]>,
) {
  const router = useRouter();

  /**
   * Returns the challenge for a given clip id (or null if none).
   */
  const challengeForClip = (clipId: string): Challenge | null => {
    return challenges.value.find((ch) => ch.clip_id === clipId) ?? null;
  };

  /**
   * Post a rating for a clip and update its local state.
   */
  const handleRate = async (clipId: string, rating: number): Promise<void> => {
    try {
      const response = await api.post<{ average_rating: number; ratings_count: number }>(
        `/api/clips/${clipId}/rate`,
        { rating },
      );
      const clip = clips.value.find((c) => c.id === clipId);
      if (clip) {
        clip.average_rating = response.data.average_rating;
        clip.ratings_count = response.data.ratings_count;
      }
    } catch {
      alert('Failed to rate');
    }
  };

  /**
   * Start a challenge for a clip, push it to the local list and navigate.
   * If the challenge already exists the server returns it in the 422 body.
   */
  const startChallengeForClip = async (clip: Clip): Promise<void> => {
    const getSlug = (c: Clip): string => {
      if (typeof c.slug === 'string') return c.slug;
      return (c.slug as Record<string, string>).en
        ?? Object.values(c.slug as Record<string, string>)[0]
        ?? '';
    };

    try {
      const res = await api.post<{ challenge: Challenge }>('/api/challenges', {
        clip_id: clip.id,
      });
      challenges.value.push(res.data.challenge);
      router.push(`/clips/${clip.id}/${getSlug(clip)}?autoplay=1`);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { challenge?: Challenge } } };
      if (err.response?.status === 403) {
        alert('You need an active subscription to start a challenge.');
      } else if (err.response?.data?.challenge) {
        challenges.value.push(err.response.data.challenge);
        router.push(`/clips/${clip.id}/${getSlug(clip)}?autoplay=1`);
      } else {
        console.error('Failed to start challenge', e);
      }
    }
  };

  return { challengeForClip, handleRate, startChallengeForClip };
}
