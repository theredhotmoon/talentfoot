<template>
  <div class="">
    <router-link to="/tags" class=" hover:text-white mb-4 inline-block" style="color: var(--tf-accent-cyan)">&larr; {{ $t('tags.back_to_list') }}</router-link>

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
                    @change="fetchTag"
                />
            </div>
            
            <div v-if="!tag.clips || tag.clips.length === 0" class="text-gray-400">
                {{ $t('tag_clips.no_clips') }}
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ClipTile
                    v-for="clip in tag.clips"
                    :key="clip.id"
                    :clip="clip"
                    :challenge="challengeForClip(clip.id)"
                    @rate="handleRate"
                    @start-challenge="startChallengeForClip"
                />
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import ClipTile from '../components/ClipTile.vue';
import SortFilterBar from '../components/SortFilterBar.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const tag = ref<any>(null);
const categories = ref<any[]>([]);
const challenges = ref<any[]>([]);
const selectedCategory = ref('');
const sortBy = ref('created_at');
const sortOrder = ref('desc');

const challengeForClip = (clipId: string) => {
    return challenges.value.find((ch: any) => ch.clip_id === clipId) || null;
};

const handleRate = async (clipId: string, rating: number) => {
    try {
        const response = await axios.post(`/api/clips/${clipId}/rate`, { rating });
        if (tag.value?.clips) {
            const clip = tag.value.clips.find((c: any) => c.id === clipId);
            if (clip) {
                clip.average_rating = response.data.average_rating;
                clip.ratings_count = response.data.ratings_count;
            }
        }
    } catch (e) {
        alert('Failed to rate');
    }
};

const startChallengeForClip = async (clip: any) => {
    try {
        const res = await axios.post('/api/challenges', { clip_id: clip.id });
        challenges.value.push(res.data.challenge);
        const slug = typeof clip.slug === 'string' ? clip.slug : clip.slug?.en || Object.values(clip.slug)[0];
        router.push(`/clips/${clip.id}/${slug}?autoplay=1`);
    } catch (e: any) {
        if (e.response?.status === 403) {
            alert('You need an active subscription to start a challenge.');
        } else if (e.response?.data?.challenge) {
            challenges.value.push(e.response.data.challenge);
            const slug = typeof clip.slug === 'string' ? clip.slug : clip.slug?.en || Object.values(clip.slug)[0];
            router.push(`/clips/${clip.id}/${slug}?autoplay=1`);
        }
    }
};

const fetchChallenges = async () => {
    try {
        const res = await axios.get('/api/challenges');
        challenges.value = res.data;
    } catch (e) {
        // silently ignore
    }
};

const fetchCategories = async () => {
    try {
        const response = await axios.get('/api/categories');
        return response.data;
    } catch (e) {
        console.error(e);
        return [];
    }
};

const fetchTag = async () => {
    try {
        const params: any = {
            sort: sortBy.value,
            order: sortOrder.value
        };
        if (selectedCategory.value) {
            params.category_id = selectedCategory.value;
        }

        const res = await axios.get(`/api/tags/${route.params.id}`, { params });
        tag.value = res.data;
    } catch (e) {
        console.error(e);
        router.push('/tags');
    }
};

const updateTag = async () => {
    try {
        await axios.put(`/api/tags/${tag.value.id}`, {
            name: tag.value.name
        });
        alert(t('upload.save')); // Simple feedback
    } catch (e) {
        console.error(e);
    }
};

const deleteTag = async () => {
    if (!confirm(t('tags.confirm_delete'))) return;
    try {
        await axios.delete(`/api/tags/${tag.value.id}`);
        router.push('/tags');
    } catch (e) {
        console.error(e);
        alert('Error deleting tag');
    }
};

onMounted(async () => {
    categories.value = await fetchCategories();
    fetchTag();
    fetchChallenges();
});
</script>
