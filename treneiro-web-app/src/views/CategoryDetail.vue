<template>
  <div class="">
    <router-link to="/categories" class="hover:text-white mb-4 inline-block" style="color: var(--tf-accent-cyan)">&larr; {{ $t('categories.back_to_list') || $t('tags.back_to_list') }}</router-link>

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
                        :model-selected-category="''"
                        @update:model-sort-by="sortBy = $event"
                        @update:model-sort-order="sortOrder = $event"
                        @change="fetchCategory"
                        :hide-category-filter="true"
                    />
                </div>
            </div>
            
            <div v-if="!category.clips || category.clips.length === 0" class="text-center py-12" style="color: var(--tf-text-muted);">
                {{ $t('tag_clips.no_clips') }}
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ClipTile
                    v-for="clip in category.clips"
                    :key="clip.id"
                    :clip="clip"
                    :challenge="challengeForClip(clip.id)"
                    @rate="handleRate"
                    @start-challenge="startChallengeForClip"
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
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';
import type { Clip, Challenge } from '../types';
import { useAuthStore } from '../stores/auth';
import { useTranslation } from '../composables/useTranslation';
import { useClipActions } from '../composables/useClipActions';
import ClipTile from '../components/ClipTile.vue';
import SortFilterBar from '../components/SortFilterBar.vue';
import EditCategoryModal from '../components/EditCategoryModal.vue';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const { getTranslated } = useTranslation();

const category = ref<any>(null);
const challenges = ref<Challenge[]>([]);
const clips = ref<Clip[]>([]);
const sortBy = ref('created_at');
const sortOrder = ref('desc');
const showEditModal = ref(false);

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
    // Keep clips ref in sync so useClipActions can update rating in-place
    clips.value = category.value?.clips ?? [];
  } catch (e) {
    console.error(e);
    router.push('/');
  }
};

onMounted(async () => {
  await Promise.all([fetchCategory(), fetchChallenges()]);
});
</script>
