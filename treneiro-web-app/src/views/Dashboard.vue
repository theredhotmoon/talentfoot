<template>
  <div>
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="flex-1">
          <h1 class="font-heading font-extrabold text-3xl gradient-text">Master Your Football Skills</h1>
          <p class="text-sm mt-1" style="color: var(--tf-text-muted);">Discover premium online courses and challenges</p>
        </div>
        <router-link to="/courses" class="text-sm hover:opacity-80 transition" style="color: var(--tf-accent-cyan);">View all →</router-link>
      </div>
    </div>
    
    <!-- Skeleton placeholders while loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="n in 9" :key="n" class="card animate-pulse">
        <!-- Thumbnail skeleton -->
        <div class="aspect-video" style="background: rgba(255,255,255,0.04); border-radius: var(--tf-radius-xl) var(--tf-radius-xl) 0 0;"></div>
        <div class="p-5 space-y-3">
          <!-- Title -->
          <div class="h-5 rounded-full w-3/4" style="background: rgba(255,255,255,0.06);"></div>
          <!-- Tags -->
          <div class="flex gap-2">
            <div class="h-4 w-14 rounded-full" style="background: rgba(255,255,255,0.05);"></div>
            <div class="h-4 w-10 rounded-full" style="background: rgba(255,255,255,0.05);"></div>
          </div>
          <!-- Stats -->
          <div class="flex gap-4">
            <div class="h-3 w-16 rounded" style="background: rgba(255,255,255,0.04);"></div>
            <div class="h-3 w-12 rounded" style="background: rgba(255,255,255,0.04);"></div>
            <div class="h-3 w-14 rounded" style="background: rgba(255,255,255,0.04);"></div>
          </div>
          <!-- Bottom row -->
          <div class="pt-3 flex justify-between" style="border-top: 1px solid var(--tf-border);">
            <div class="h-6 w-24 rounded" style="background: rgba(255,255,255,0.04);"></div>
            <div class="h-6 w-20 rounded-lg" style="background: rgba(255,255,255,0.04);"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ClipTile
        v-for="clip in clips.slice(0, 6)"
        :key="clip.id"
        :clip="clip"
        :challenge="challengeForClip(clip.id)"
        @rate="handleRate"
        @start-challenge="startChallengeForClip"
      />
    </div>

    <!-- My Challenges Section (below clips) -->
    <!-- Skeleton placeholders while loading -->
    <div v-if="loading" class="mt-10">
      <div class="flex justify-between items-center mb-4">
        <div class="h-6 w-48 rounded-full animate-pulse" style="background: rgba(255,255,255,0.06);"></div>
        <div class="h-4 w-24 rounded animate-pulse" style="background: rgba(255,255,255,0.04);"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="n in 3" :key="n" class="card-static p-4 flex gap-4 items-center animate-pulse" style="border-radius: var(--tf-radius-lg);">
          <div class="w-16 h-16 rounded-lg flex-shrink-0" style="background: rgba(255,255,255,0.04);"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 w-3/4 rounded" style="background: rgba(255,255,255,0.06);"></div>
            <div class="h-1.5 w-full rounded-full" style="background: rgba(255,255,255,0.04);"></div>
            <div class="h-4 w-16 rounded-full" style="background: rgba(255,255,255,0.04);"></div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="auth.isAuthenticated && challenges.length > 0" class="mt-10">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-heading font-bold text-xl flex items-center gap-2" style="color: var(--tf-text);"><IconLightning :size="20" class="text-current" style="color: var(--tf-accent-amber);" /> {{ $t('challenges.my_active') }}</h2>
        <router-link to="/my-challenges" class="text-sm hover:opacity-80 transition" style="color: var(--tf-accent-emerald);">{{ $t('challenges.view_all') }} →</router-link>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <router-link
          v-for="ch in challenges.slice(0, 3)"
          :key="ch.id"
          :to="`/challenge/${ch.clip_id}/${getTranslated(ch.clip_slug)}`"
          class="card-static p-4 flex gap-4 items-center transition-all duration-200 hover:scale-[1.01]"
          style="border-radius: var(--tf-radius-lg); text-decoration: none;"
        >
          <div class="w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden" style="background: rgba(255,255,255,0.04);">
            <img v-if="ch.clip_thumbnail" :src="getThumbnailUrl(ch.clip_thumbnail)" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <IconTrophy v-if="ch.is_completed" :size="24" style="color: var(--tf-accent-emerald);" />
              <IconLightning v-else :size="24" style="color: var(--tf-accent-amber);" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate" style="color: var(--tf-text);">{{ getTranslated(ch.clip_name) }}</p>
            <div class="flex items-center gap-2 mt-1">
              <div class="flex-1 h-1.5 rounded-full" style="background: rgba(255,255,255,0.08);">
                <div class="h-1.5 rounded-full transition-all duration-500"
                     :style="`width: ${(ch.watched_items / ch.total_items) * 100}%; background: ${ch.is_completed ? 'var(--tf-gradient-primary)' : 'var(--tf-gradient-warm)'};`"></div>
              </div>
              <span class="text-[10px] whitespace-nowrap" style="color: var(--tf-text-dimmed);">{{ ch.watched_items }}/{{ ch.total_items }}</span>
            </div>
            <span class="text-[10px] mt-1 inline-block px-2 py-0.5 rounded-full font-semibold"
                  :style="ch.is_completed
                    ? 'background: rgba(110,231,183,0.15); color: var(--tf-accent-emerald);'
                    : 'background: rgba(251,191,36,0.15); color: var(--tf-accent-amber);'">
              {{ ch.is_completed ? $t('challenges.completed') : $t('challenges.in_progress') }}
            </span>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api';
import { useAuthStore } from '../stores/auth';
import type { Clip, Challenge } from '../types';
import { useClipActions } from '../composables/useClipActions';
import { useTranslation } from '../composables/useTranslation';
import { useMediaUrl } from '../composables/useMediaUrl';
import { useHead } from '@unhead/vue';
import ClipTile from '../components/ClipTile.vue';
import IconLightning from '../components/icons/IconLightning.vue';
import IconTrophy from '../components/icons/IconTrophy.vue';

const auth = useAuthStore();
const { getTranslated } = useTranslation();
const { getThumbnailUrl } = useMediaUrl();

const clips = ref<Clip[]>([]);
const challenges = ref<Challenge[]>([]);
const loading = ref(true);

useHead({
  title: 'Master Your Football Skills',
  meta: [
    { name: 'description', content: 'Join TalentFoot and master your football skills with our premium training videos and challenges.' }
  ]
});

const { challengeForClip, handleRate, startChallengeForClip } = useClipActions(clips, challenges);



const fetchClips = async (): Promise<void> => {
  loading.value = true;
  try {
    const params: Record<string, string> = {
      sort: 'created_at',
      order: 'desc',
    };
    const response = await api.get<{ data: Clip[] }>('/api/clips', { params });
    clips.value = response.data.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const fetchChallenges = async (): Promise<void> => {
  try {
    const res = await api.get<Challenge[]>('/api/challenges');
    challenges.value = res.data;
  } catch {
    // User might not be authenticated — silently ignore
  }
};

onMounted(() => {
  fetchClips();
  if (auth.isAuthenticated) fetchChallenges();
});
</script>
