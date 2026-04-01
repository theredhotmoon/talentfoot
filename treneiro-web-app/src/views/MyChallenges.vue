<template>
  <div>
    
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 class="font-heading font-extrabold text-3xl gradient-text">{{ $t('challenges.title') || 'My Challenges' }}</h1>
            <p class="text-sm mt-1" style="color: var(--tf-text-muted);">{{ $t('challenges.subtitle') || 'Monitor your active courses' }}</p>
        </div>
        <SortFilterBar
            :categories="[]"
            :model-sort-by="sortBy"
            :model-sort-order="sortOrder"
            :model-selected-category="selectedCategory"
            @update:model-sort-by="sortBy = $event"
            @update:model-sort-order="sortOrder = $event"
            @change="handleFilterChange"
            :hide-category-filter="true"
        />
    </div>

    <div v-if="loading" class="text-center py-16" style="color: var(--tf-text-muted);">
      <div class="w-8 h-8 rounded-full mx-auto mb-3 animate-spin" style="border: 3px solid var(--tf-border); border-top-color: var(--tf-accent-emerald);"></div>
    </div>

    <div v-else-if="challenges.length === 0" class="text-center py-16">
      <div class="text-5xl mb-4">🏆</div>
      <p style="color: var(--tf-text-muted);">{{ $t('challenges.no_challenges') }}</p>
      <router-link to="/" class="btn-primary text-sm mt-4 inline-flex">{{ $t('challenges.browse_clips') }}</router-link>
    </div>

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="ch in currentChallenges" :key="ch.id" class="card-static overflow-hidden" style="border-radius: var(--tf-radius-xl);">
        <!-- Thumbnail -->
        <router-link :to="`/challenge/${ch.clip_id}/${getTranslated(ch.clip_slug)}`" class="block">
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
          <router-link :to="`/challenge/${ch.clip_id}/${getTranslated(ch.clip_slug)}`" class="hover:opacity-80 transition-opacity">
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
      <AppPagination
        :current-page="page"
        :total-pages="totalPages"
        @update:current-page="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api';
import type { Challenge } from '../types';
import { useTranslation } from '../composables/useTranslation';
import { useMediaUrl } from '../composables/useMediaUrl';
import { useSortFilterSync } from '../composables/useSortFilterSync';

import SortFilterBar from '../components/SortFilterBar.vue';
import AppPagination from '../components/AppPagination.vue';

const route = useRoute();

const { getTranslated } = useTranslation();
const { getThumbnailUrl } = useMediaUrl();

const challenges = ref<Challenge[]>([]);
const loading = ref(true);

const { sortBy, sortOrder, selectedCategory, page, updateQuery, initFromQuery } = useSortFilterSync('started_at');

const perPage = 9;

const handleFilterChange = () => {
    page.value = 1;
    updateQuery();
};

const handlePageChange = (newPage: number) => {
    page.value = newPage;
    updateQuery();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const sortedChallenges = computed(() => {
    let sorted = [...challenges.value];
    
    sorted.sort((a, b) => {
        let valA: any = a.started_at;
        let valB: any = b.started_at;
        
        if (sortBy.value === 'views') {
             // Mock views/progress
             valA = a.watched_items;
             valB = b.watched_items;
        } else if (sortBy.value === 'created_at') {
             valA = a.started_at;
             valB = b.started_at;
        } else if (sortBy.value === 'average_rating') {
             valA = a.is_completed ? 1 : 0;
             valB = b.is_completed ? 1 : 0;
        }
        
        if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
        return 0;
    });
    
    return sorted;
});

const currentChallenges = computed(() => {
    const startIndex = (page.value - 1) * perPage;
    return sortedChallenges.value.slice(startIndex, startIndex + perPage);
});

const totalPages = computed(() => {
    return Math.ceil(sortedChallenges.value.length / perPage) || 1;
});

const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(async () => {
  initFromQuery();
  try {
    const res = await api.get<Challenge[]>('/api/challenges');
    challenges.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

watch(() => route.query, (newQ, oldQ) => {
   if (newQ.page !== oldQ.page || newQ.sort !== oldQ.sort || newQ.category !== oldQ.category) {
       initFromQuery();
   }
}, { deep: true });
</script>
