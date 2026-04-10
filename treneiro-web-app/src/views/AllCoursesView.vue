<template>
  <div class="">

    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 class="font-heading font-extrabold text-3xl gradient-text">Online Football Courses</h1>
        </div>
        <SortFilterBar
            :categories="categories"
            :model-sort-by="sortBy"
            :model-sort-order="sortOrder"
            :model-selected-category="selectedCategory"
            @update:model-sort-by="sortBy = $event"
            @update:model-sort-order="sortOrder = $event"
            @update:model-selected-category="selectedCategory = $event"
            @change="handleFilterChange"
        />
    </div>

    <!-- Skeleton placeholders -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="n in 9" :key="n" class="card animate-pulse">
        <div class="aspect-video" style="background: rgba(255,255,255,0.04); border-radius: var(--tf-radius-xl) var(--tf-radius-xl) 0 0;"></div>
        <div class="p-5 space-y-3">
          <div class="h-5 rounded-full w-3/4" style="background: rgba(255,255,255,0.06);"></div>
          <div class="flex gap-2">
            <div class="h-4 w-14 rounded-full" style="background: rgba(255,255,255,0.05);"></div>
            <div class="h-4 w-10 rounded-full" style="background: rgba(255,255,255,0.05);"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="clips.length === 0" class="text-center py-16 text-gray-400">
      {{ $t('tag_clips.no_clips') || 'No courses found.' }}
    </div>

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ClipTile
          v-for="clip in currentClips"
          :key="clip.id"
          :clip="clip"
          :challenge="challengeForClip(clip.id)"
          @rate="handleRate"
          @start-challenge="startChallengeForClip"
        />
      </div>

      <!-- Pagination -->
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
import { useAuthStore } from '../stores/auth';
import { useSettingsStore } from '../stores/settings';
import type { Clip, Challenge, Category } from '../types';
import { useClipActions } from '../composables/useClipActions';
import { useSortFilterSync } from '../composables/useSortFilterSync';
import { useHead } from '@unhead/vue';
import ClipTile from '../components/ClipTile.vue';
import SortFilterBar from '../components/SortFilterBar.vue';

import AppPagination from '../components/AppPagination.vue';

const route = useRoute();
const auth = useAuthStore();
const settingsStore = useSettingsStore();

const clips = ref<Clip[]>([]);
const categories = ref<Category[]>([]);
const challenges = ref<Challenge[]>([]);
const loading = ref(true);

useHead({
  title: 'Online Football Courses Catalog',
  meta: [
    { name: 'description', content: 'Browse our extensive catalog of professional football courses. Learn new techniques, soccer skills, and strategy.' }
  ]
});

const { sortBy, sortOrder, selectedCategory, page, updateQuery, initFromQuery } = useSortFilterSync();

// Dynamic per-page count driven by admin settings
const perPage = computed(() => settingsStore.perPageCount);

const handleFilterChange = () => {
    page.value = 1; // Reset to page 1 on filter
    updateQuery();
    fetchClips();
};

const handlePageChange = (newPage: number) => {
    page.value = newPage;
    updateQuery();
    // No need to fetch API here if we do client-side chunking, but if we do server side: fetchClips()
    // By default Laravel sends paginated response but treneiro returns .data.data ?
    // If it returns hundreds of clips we probably want server-side. Wait, standard `/api/clips` in treneiro currently returned { data: Clip[] }. Let's assume it returns all matching or we can chunk locally.
    // I will chunk locally to guarantee 9 per page if full dataset comes, or rely on API if `current_page` is returned.
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Client-side chunking fallback inside computed
const currentClips = computed(() => {
    const startIndex = (page.value - 1) * perPage.value;
    return clips.value.slice(startIndex, startIndex + perPage.value);
});

const totalPages = computed(() => {
    return Math.ceil(clips.value.length / perPage.value) || 1;
});

const { challengeForClip, handleRate, startChallengeForClip } = useClipActions(clips, challenges);

const fetchCategories = async (): Promise<void> => {
  try {
    const response = await api.get<Category[]>('/api/categories');
    categories.value = response.data;
  } catch (e) {
    console.error(e);
  }
};

const fetchClips = async (): Promise<void> => {
  loading.value = true;
  try {
    const params: Record<string, string> = {
      sort: sortBy.value,
      order: sortOrder.value,
    };
    if (selectedCategory.value) {
      params.category_id = selectedCategory.value;
    }
    // API might return standard Array or Laravel { data: Array } object.
    const response = await api.get<{ data: Clip[] } | Clip[]>('/api/clips', { params });
    const data = response.data;
    if (Array.isArray(data)) {
        clips.value = data;
    } else if (data && Array.isArray(data.data)) {
        clips.value = data.data;
    } else {
        clips.value = [];
    }
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
    // silently ignore
  }
};

onMounted(() => {
  initFromQuery();
  fetchCategories();
  fetchClips();
  if (auth.isAuthenticated) fetchChallenges();
});

watch(() => route.query, (newQ, oldQ) => {
   if (newQ.page !== oldQ.page || newQ.sort !== oldQ.sort || newQ.category !== oldQ.category) {
       initFromQuery();
       // Only fetch clips again if filter changed. Page change just triggers chunk recompute.
       if (newQ.sort !== oldQ.sort || newQ.category !== oldQ.category) {
           fetchClips();
       }
   }
}, { deep: true });
</script>
