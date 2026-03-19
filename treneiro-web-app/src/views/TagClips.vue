<template>
  <div class="">
    <div class="mb-6">
        <router-link to="/" class=" hover:text-white mb-2 inline-block" style="color: var(--tf-accent-cyan)">&larr; {{ $t('tag_clips.back') }}</router-link>
        <h1 class="text-3xl font-heading font-bold gradient-text">{{ $t('tag_clips.title') }} "<span class="" style="color: var(--tf-accent-cyan)"">{{ tag }}</span>"</h1>
    </div>
    
    <div v-if="loading" class="text-white">{{ $t('tag_clips.loading') }}</div>
    <div v-else-if="clips.length === 0" class="text-white">{{ $t('tag_clips.no_clips') }}</div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="clip in clips" :key="clip.id" class="card-static overflow-hidden shadow-lg">
        <div class="bg-black aspect-video relative group cursor-pointer">
            <router-link :to="`/clips/${clip.id}/${clip.slug}`">
                <video :src="getVideoUrl(clip.file_path)" class="w-full h-full object-contain pointer-events-none"></video>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                    <span class="text-white font-bold text-lg">{{ $t('dashboard.view_details') }}</span>
                </div>
            </router-link>
        </div>
        <div class="p-4 text-white">
          <router-link :to="`/clips/${clip.id}/${clip.slug}`" class="hover:opacity-80 transition-colors">
            <h3 class="font-bold text-xl mb-2">{{ clip.name }}</h3>
          </router-link>
          <p class="text-sm" style="color: var(--tf-text-muted) mb-4">{{ clip.description }}</p>
          
          <div class="flex flex-wrap gap-2 mb-4" v-if="clip.tags">
            <template v-for="t in clip.tags" :key="t">
                <router-link 
                    v-if="t !== tag"
                    :to="`/tags/${t}`" 
                    class="bg-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-600 transition"
                >
                    {{ t }}
                </router-link>
                <span v-else class="bg-blue-600 px-2 py-1 rounded text-xs cursor-default">{{ t }}</span>
            </template>
          </div>
          
          <div class="flex justify-between items-center text-sm mb-2">
            <span>{{ $t('dashboard.difficulty') }}: <span class="font-bold text-yellow-500">{{ clip.difficulty }}/10</span></span>
            <span>{{ $t('dashboard.rating') }}: <span class="font-bold text-green-500">{{ clip.average_rating || 0 }}/10</span> ({{ clip.ratings_count }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useMediaUrl } from '../composables/useMediaUrl';

const { getVideoUrl } = useMediaUrl();

interface Clip {
  id: string;
  name: string;
  slug: string;
  description: string;
  file_path: string;
  tags: string[] | null;
  difficulty: number;
  average_rating: number;
  ratings_count: number;
}

const route = useRoute();
const tag = ref(route.params.tag as string);
const clips = ref<Clip[]>([]);
const loading = ref(true);

const fetchClips = async () => {
    loading.value = true;
    try {
        const response = await axios.get(`/api/clips?tag=${tag.value}`);
        clips.value = response.data.data;
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

watch(() => route.params.tag, (newTag) => {
    if (newTag) {
        tag.value = newTag as string;
        fetchClips();
    }
});

onMounted(() => {
    fetchClips();
});
</script>
