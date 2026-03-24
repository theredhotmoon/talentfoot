<template>
  <div class="">
    <div class="mb-4">
        <AppBackButton />
    </div>

    <div v-if="tag" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Edit Form -->
        <div v-if="authStore.isAdmin" class="bg-gray-800 p-6 rounded shadow h-fit">
            <h1 class="text-2xl font-bold mb-6">{{ $t('tags.edit_tag') }}</h1>
            
            <div class="mb-4">
                <label class="block mb-1" style="color: var(--tf-text-muted)">Name (EN)</label>
                <input v-model="tag.name.en" class="w-full input-modern">
            </div>
             <div class="mb-4">
                <label class="block mb-1" style="color: var(--tf-text-muted)">Name (PL)</label>
                <input v-model="tag.name.pl" class="w-full input-modern">
            </div>
             <div class="mb-4">
                <label class="block mb-1" style="color: var(--tf-text-muted)">Name (ES)</label>
                <input v-model="tag.name.es" class="w-full input-modern">
            </div>

            <div class="flex justify-between mt-6">
                <button 
                    @click="deleteTag" 
                    :disabled="tag.clips && tag.clips.length > 0"
                    class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    :title="tag.clips && tag.clips.length > 0 ? $t('tags.cannot_delete') : ''"
                >
                    {{ $t('dashboard.delete') }}
                </button>
                <button @click="updateTag" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                    {{ $t('upload.save') }}
                </button>
            </div>
            <p v-if="tag.clips && tag.clips.length > 0" class="text-xs text-gray-500 mt-2">
                {{ $t('tags.delete_warning') }}
            </p>
        </div>

        <!-- Clips List -->
        <div class="lg:col-span-2">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">{{ $t('tags.associated_clips') }} ({{ tag.clips ? tag.clips.length : 0 }})</h2>
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
            
            <div v-if="!tag.clips || tag.clips.length === 0" class="text-gray-400">
                {{ $t('tag_clips.no_clips') }}
            </div>

            <div v-else>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '../api';
import type { Clip, Challenge, Category } from '../types';
import { useAuthStore } from '../stores/auth';
import { useClipActions } from '../composables/useClipActions';
import ClipTile from '../components/ClipTile.vue';
import SortFilterBar from '../components/SortFilterBar.vue';
import AppBackButton from '../components/AppBackButton.vue';
import AppPagination from '../components/AppPagination.vue';
import { useSortFilterSync } from '../composables/useSortFilterSync';

const { t } = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const tag = ref<any>(null);
const categories = ref<Category[]>([]);
const challenges = ref<Challenge[]>([]);

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
    // Keep clips ref in sync so useClipActions can update rating in-place
    clips.value = tag.value?.clips ?? [];
  } catch (e) {
    console.error(e);
    router.push('/tags');
  }
};

const updateTag = async (): Promise<void> => {
  try {
    await api.put(`/api/tags/${tag.value.id}`, { name: tag.value.name });
    alert(t('upload.save'));
  } catch (e) {
    console.error(e);
  }
};

const deleteTag = async (): Promise<void> => {
  if (!confirm(t('tags.confirm_delete'))) return;
  try {
    await api.delete(`/api/tags/${tag.value.id}`);
    router.push('/tags');
  } catch (e) {
    console.error(e);
    alert('Error deleting tag');
  }
};

onMounted(async () => {
  initFromQuery();
  categories.value = await fetchCategories();
  fetchTag();
  fetchChallenges();
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
