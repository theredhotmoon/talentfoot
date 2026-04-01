<template>
  <div class="">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="font-heading font-extrabold text-3xl gradient-text">{{ $t('tags.title') }}</h1>
        <p class="text-sm mt-1" style="color: var(--tf-text-muted);">{{ $t('tags.subtitle') }}</p>
      </div>
      <button @click="showCreateModal = true" v-if="auth.isAdmin" class="btn-primary text-sm">
        {{ $t('tags.add_new') }}
      </button>
    </div>

    <!-- Tags Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <router-link
        v-for="tag in tags"
        :key="tag.id"
        :to="`/tags/${tag.id}`"
        class="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
        style="border-radius: var(--tf-radius-xl); text-decoration: none; min-height: 180px;"
      >
        <!-- Thumbnail mosaic background -->
        <div class="absolute inset-0">
          <!-- 4-tile mosaic if 4+ thumbnails -->
          <div v-if="tag.preview_thumbnails && tag.preview_thumbnails.length >= 4" class="grid grid-cols-2 grid-rows-2 w-full h-full">
            <img v-for="(thumb, i) in tag.preview_thumbnails.slice(0, 4)" :key="i" :src="getThumbnailUrl(thumb)" alt="" class="w-full h-full object-cover" />
          </div>
          <!-- 2-tile split if 2-3 thumbnails -->
          <div v-else-if="tag.preview_thumbnails && tag.preview_thumbnails.length >= 2" class="grid grid-cols-2 w-full h-full">
            <img v-for="(thumb, i) in tag.preview_thumbnails.slice(0, 2)" :key="i" :src="getThumbnailUrl(thumb)" alt="" class="w-full h-full object-cover" />
          </div>
          <!-- Single thumbnail -->
          <div v-else-if="tag.preview_thumbnails && tag.preview_thumbnails.length === 1" class="w-full h-full">
            <img :src="getThumbnailUrl(tag.preview_thumbnails[0])" alt="" class="w-full h-full object-cover" />
          </div>
          <!-- Fallback gradient if no thumbnails -->
          <div v-else class="w-full h-full" :style="`background: linear-gradient(135deg, hsl(${(tag.id?.charCodeAt?.(0) || 0) * 37 % 360}, 60%, 25%), hsl(${(tag.id?.charCodeAt?.(0) || 0) * 37 % 360 + 60}, 50%, 15%));`"></div>
        </div>

        <!-- Dark gradient overlay -->
        <div class="absolute inset-0 transition-opacity duration-300" style="background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%);"></div>
        <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style="background: linear-gradient(to top, rgba(16,185,129,0.15) 0%, transparent 60%);"></div>

        <!-- Content -->
        <div class="relative z-10 flex flex-col justify-end h-full p-5">
          <h3 class="font-heading font-bold text-2xl mb-1 text-white group-hover:text-emerald-300 transition-colors duration-300">
            {{ getTranslated(tag.name) }}
          </h3>
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-0.5 rounded-full font-semibold" style="background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.8);">
              {{ tag.clips_count }} {{ $t('tags.clips_count') }}
            </span>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="card-static p-6 w-full max-w-md">
        <h2 class="text-2xl font-heading font-bold mb-4">{{ $t('tags.add_new') }}</h2>
        
        <div class="mb-4">
          <label class="block mb-1" style="color: var(--tf-text-muted)">EN</label>
          <input v-model="newTag.name.en" class="w-full input-modern">
        </div>
        <div class="mb-4">
          <label class="block mb-1" style="color: var(--tf-text-muted)">PL</label>
          <input v-model="newTag.name.pl" class="w-full input-modern">
        </div>
        <div class="mb-4">
          <label class="block mb-1" style="color: var(--tf-text-muted)">ES</label>
          <input v-model="newTag.name.es" class="w-full input-modern">
        </div>

        <div class="flex justify-end gap-2">
          <button @click="showCreateModal = false" class="btn-ghost">Cancel</button>
          <button @click="createTag" class="btn-primary">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api';
import type { Tag } from '../types';
import { useAuthStore } from '../stores/auth';
import { useTranslation } from '../composables/useTranslation';
import { useMediaUrl } from '../composables/useMediaUrl';

const { getTranslated } = useTranslation();
const { getThumbnailUrl } = useMediaUrl();
const auth = useAuthStore();

const tags = ref<(Tag & { clips_count?: number; preview_thumbnails?: string[] })[]>([]);
const showCreateModal = ref(false);
const newTag = ref({ name: { en: '', pl: '', es: '' } });

const fetchTags = async (): Promise<void> => {
  const res = await api.get('/api/tags');
  tags.value = res.data;
};

const createTag = async (): Promise<void> => {
  if (!newTag.value.name.en) return;
  try {
    await api.post('/api/tags', newTag.value);
    showCreateModal.value = false;
    newTag.value = { name: { en: '', pl: '', es: '' } };
    fetchTags();
  } catch (e) {
    console.error(e);
  }
};

onMounted(fetchTags);
</script>
