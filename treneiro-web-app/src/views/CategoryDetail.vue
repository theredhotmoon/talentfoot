<template>
  <div class="">

    <div v-if="category">
        <!-- Clips Section -->
        <div>
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h2 class="font-heading font-extrabold text-3xl gradient-text">{{ getTranslated(category.name) }}</h2>
                    <p class="text-sm mt-1" style="color: var(--tf-text-muted);">{{ category.clips ? category.clips.length : 0 }} {{ $t('tags.clips_count') }}</p>
                </div>
                <div class="flex items-center gap-3">
                    <button v-if="authStore.isAdmin" @click="showEditModal = true" class="btn-ghost text-sm flex items-center gap-2">
                        ✏️ {{ $t('categories.edit_category') }}
                    </button>
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
            </div>
            
            <div v-if="!category.clips || category.clips.length === 0" class="text-center py-12" style="color: var(--tf-text-muted);">
                {{ $t('tag_clips.no_clips') }}
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
                <AppPagination
                    :current-page="page"
                    :total-pages="totalPages"
                    @update:current-page="handlePageChange"
                />
            </div>
        </div>
    </div>

    <div v-else class="text-center py-12" style="color: var(--tf-text-muted);">
        {{ $t('common.loading') || 'Loading...' }}
    </div>

    <!-- Shared Edit Category Modal -->
    <EditCategoryModal
        v-if="showEditModal"
        :category="category"
        @close="showEditModal = false"
        @saved="fetchCategory"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';
import type { Clip, Challenge } from '../types';
import { useAuthStore } from '../stores/auth';
import { useTranslation } from '../composables/useTranslation';
import { useClipActions } from '../composables/useClipActions';
import { useBreadcrumbLabel } from '../composables/useBreadcrumbLabel';
import ClipTile from '../components/ClipTile.vue';
import SortFilterBar from '../components/SortFilterBar.vue';
import EditCategoryModal from '../components/EditCategoryModal.vue';

import AppPagination from '../components/AppPagination.vue';
import { useSortFilterSync } from '../composables/useSortFilterSync';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const { getTranslated } = useTranslation();
const { setBreadcrumbLabel } = useBreadcrumbLabel();

const category = ref<any>(null);
const challenges = ref<Challenge[]>([]);
const clips = ref<Clip[]>([]);
const showEditModal = ref(false);

const { sortBy, sortOrder, selectedCategory, page, updateQuery, initFromQuery } = useSortFilterSync();

const perPage = 9;

const handleFilterChange = () => {
    page.value = 1;
    updateQuery();
    fetchCategory();
};

const handlePageChange = (newPage: number) => {
    page.value = newPage;
    updateQuery();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const currentClips = computed(() => {
    const startIndex = (page.value - 1) * perPage;
    return clips.value.slice(startIndex, startIndex + perPage);
});

const totalPages = computed(() => {
    return Math.ceil(clips.value.length / perPage) || 1;
});

const { challengeForClip, handleRate, startChallengeForClip } = useClipActions(clips, challenges);

const fetchChallenges = async (): Promise<void> => {
  try {
    const res = await api.get<Challenge[]>('/api/challenges');
    challenges.value = res.data;
  } catch {
    // silently ignore
  }
};

const fetchCategory = async (): Promise<void> => {
  try {
    const res = await api.get(`/api/categories/${route.params.id}`, {
      params: { sort: sortBy.value, order: sortOrder.value },
    });
    category.value = res.data;
    // Register the category name so the breadcrumb shows it instead of the UUID
    setBreadcrumbLabel(String(route.params.id), getTranslated(category.value?.name));
    // Keep clips ref in sync so useClipActions can update rating in-place
    clips.value = category.value?.clips ?? [];
  } catch (e) {
    console.error(e);
    router.push('/');
  }
};

onMounted(async () => {
  initFromQuery();
  await fetchCategory();
  if (authStore.isAuthenticated) await fetchChallenges();
});

// Watch route query changes (e.g., when clicking back button and returning to a saved filter state)
watch(() => route.query, (newQ, oldQ) => {
   if (newQ.page !== oldQ.page || newQ.sort !== oldQ.sort || newQ.category !== oldQ.category) {
       initFromQuery();
       if (newQ.sort !== oldQ.sort || newQ.category !== oldQ.category) {
           fetchCategory();
       }
   }
}, { deep: true });
</script>
