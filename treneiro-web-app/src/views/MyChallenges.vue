<template>
  <div>
    <h1 class="font-heading font-extrabold text-3xl gradient-text mb-2">{{ $t('challenges.title') }}</h1>
    <p class="text-sm mb-8" style="color: var(--tf-text-muted);">{{ $t('challenges.subtitle') }}</p>

    <div v-if="loading" class="text-center py-16" style="color: var(--tf-text-muted);">
      <div class="w-8 h-8 rounded-full mx-auto mb-3 animate-spin" style="border: 3px solid var(--tf-border); border-top-color: var(--tf-accent-emerald);"></div>
    </div>

    <div v-else-if="challenges.length === 0" class="text-center py-16">
      <div class="text-5xl mb-4">🏆</div>
      <p style="color: var(--tf-text-muted);">{{ $t('challenges.no_challenges') }}</p>
      <router-link to="/" class="btn-primary text-sm mt-4 inline-flex">{{ $t('challenges.browse_clips') }}</router-link>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="ch in challenges" :key="ch.id" class="card-static overflow-hidden" style="border-radius: var(--tf-radius-xl);">
        <!-- Thumbnail -->
        <router-link :to="`/clips/${ch.clip_id}/${getTranslated(ch.clip_slug)}`" class="block">
          <div class="aspect-video relative" style="background: rgba(255,255,255,0.04);">
            <img v-if="ch.clip_thumbnail" :src="getThumbnailUrl(ch.clip_thumbnail)" class="w-full h-full object-cover" />
            <div class="absolute inset-0 flex items-center justify-center" style="background: rgba(0,0,0,0.3);">
              <span v-if="ch.is_completed" class="text-4xl">🏆</span>
              <span v-else class="text-4xl">⚡</span>
            </div>
            <!-- Status badge -->
            <div class="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold"
                 :style="ch.is_completed 
                    ? 'background: rgba(110,231,183,0.2); color: var(--tf-accent-emerald); border: 1px solid rgba(110,231,183,0.3);' 
                    : 'background: rgba(251,191,36,0.2); color: var(--tf-accent-amber); border: 1px solid rgba(251,191,36,0.3);'">
              {{ ch.is_completed ? $t('challenges.completed') : $t('challenges.in_progress') }}
            </div>
          </div>
        </router-link>

        <div class="p-5">
          <router-link :to="`/clips/${ch.clip_id}/${getTranslated(ch.clip_slug)}`" class="hover:opacity-80 transition-opacity">
            <h3 class="font-heading font-bold text-lg mb-3" style="color: var(--tf-text);">{{ getTranslated(ch.clip_name) }}</h3>
          </router-link>

          <!-- Progress bar -->
          <div class="mb-4">
            <div class="flex justify-between text-xs mb-1" style="color: var(--tf-text-muted);">
              <span>{{ $t('challenges.progress') }}</span>
              <span>{{ ch.watched_items }}/{{ ch.total_items }}</span>
            </div>
            <div class="w-full h-2 rounded-full" style="background: rgba(255,255,255,0.08);">
              <div class="h-2 rounded-full transition-all duration-500"
                   :style="`width: ${(ch.watched_items / ch.total_items) * 100}%; background: ${ch.is_completed ? 'var(--tf-gradient-primary)' : 'var(--tf-gradient-warm)'};`"></div>
            </div>
          </div>

          <!-- Dates -->
          <div class="space-y-1.5 text-sm" style="color: var(--tf-text-muted);">
            <div class="flex justify-between">
              <span>📅 {{ $t('challenges.started') }}</span>
              <span style="color: var(--tf-text);">{{ formatDate(ch.started_at) }}</span>
            </div>
            <div v-if="ch.finished_at" class="flex justify-between">
              <span>🏁 {{ $t('challenges.finished') }}</span>
              <span style="color: var(--tf-accent-emerald);">{{ formatDate(ch.finished_at) }}</span>
            </div>
            <div v-if="ch.duration" class="flex justify-between">
              <span>⏱️ {{ $t('challenges.duration') }}</span>
              <span style="color: var(--tf-accent-cyan);">{{ ch.duration }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useTranslation } from '../composables/useTranslation';
import { useMediaUrl } from '../composables/useMediaUrl';

const { getTranslated } = useTranslation();
const { getThumbnailUrl } = useMediaUrl();

const challenges = ref<any[]>([]);
const loading = ref(true);

const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

onMounted(async () => {
    try {
        const res = await axios.get('/api/challenges');
        challenges.value = res.data;
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
});
</script>
