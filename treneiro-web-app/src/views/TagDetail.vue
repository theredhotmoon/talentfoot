<template>
  <div class="">

    <div v-if="tag">
        <!-- Clips Section -->
        <div>
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 class="font-heading font-extrabold text-3xl gradient-text">{{ getTranslated(tag.name) }}</h2>
                    <p class="text-sm mt-1" style="color: var(--tf-text-muted);">{{ tag.clips ? tag.clips.length : 0 }} {{ $t('tags.clips_count') || 'clips' }}</p>
                </div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <button v-if="authStore.isAdmin" @click="showEditModal = true" class="btn-ghost flex-shrink-0 text-sm flex items-center justify-center gap-2">
                        ✏️ {{ $t('tags.edit_tag') }}
                    </button>
                    <div class="flex-shrink-0 flex items-center w-full sm:w-auto">
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
                </div>
            </div>
            
            <div v-if="!tag.clips || tag.clips.length === 0" class="text-center py-12" style="color: var(--tf-text-muted);">
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

    <!-- Shared Edit Tag Modal -->
    <EditTagModal
        v-if="showEditModal"
        :tag="tag"
        @close="showEditModal = false"
        @saved="fetchTag"
        @deleted="router.push('/tags')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';
import type { Clip, Challenge, Category } from '../types';
import { useAuthStore } from '../stores/auth';
import { useTranslation } from '../composables/useTranslation';
import { useClipActions } from '../composables/useClipActions';
import { useBreadcrumbLabel } from '../composables/useBreadcrumbLabel';
import ClipTile from '../components/ClipTile.vue';
import SortFilterBar from '../components/SortFilterBar.vue';
import EditTagModal from '../components/EditTagModal.vue';

import AppPagination from '../components/AppPagination.vue';
import { useSortFilterSync } from '../composables/useSortFilterSync';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const { getTranslated } = useTranslation();
const { setBreadcrumbLabel } = useBreadcrumbLabel();

const tag = ref<any>(null);
const categories = ref<Category[]>([]);
const challenges = ref<Challenge[]>([]);
const showEditModal = ref(false);

const { sortBy, sortOrder, selectedCategory, page, updateQuery, initFromQuery } = useSortFilterSync();

const perPage = 9;

const handleFilterChange = () => {
    page.value = 1;
    updateQuery();
    fetchTag();
};

const handlePageChange = (newPage: number) => {
    page.value = newPage;
    updateQuery();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// clips is derived from tag.clips — we create a computed-like ref to pass to useClipActions
const clips = ref<Clip[]>([]);

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

const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get<Category[]>('/api/categories');
    return response.data;
  } catch (e) {
    console.error(e);
    return [];
  }
};

const fetchTag = async (): Promise<void> => {
  try {
    const params: Record<string, string> = {
      sort: sortBy.value,
      order: sortOrder.value,
    };
    if (selectedCategory.value) {
      params.category_id = selectedCategory.value;
    }
    const res = await api.get(`/api/tags/${route.params.id}`, { params });
    tag.value = res.data;
    // Register the tag name so the breadcrumb shows it instead of the UUID
    setBreadcrumbLabel(String(route.params.id), getTranslated(tag.value?.name));
    // Keep clips ref in sync so useClipActions can update rating in-place
    clips.value = tag.value?.clips ?? [];
  } catch (e) {
    console.error(e);
    router.push('/tags');
  }
};

onMounted(async () => {
  initFromQuery();
  categories.value = await fetchCategories();
  fetchTag();
  if (authStore.isAuthenticated) fetchChallenges();
});

watch(() => route.query, (newQ, oldQ) => {
   if (newQ.page !== oldQ.page || newQ.sort !== oldQ.sort || newQ.category !== oldQ.category) {
       initFromQuery();
       if (newQ.sort !== oldQ.sort || newQ.category !== oldQ.category) {
           fetchTag();
       }
   }
}, { deep: true });
</script>
