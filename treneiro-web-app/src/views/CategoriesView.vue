<template>
  <div class="">
    <div class="flex justify-between items-center mb-6">
        <div>
            <h1 class="font-heading font-extrabold text-3xl gradient-text">{{ $t('categories.title') || 'Categories' }}</h1>
        </div>
    </div>

    <div v-if="loading" class="text-center py-16 text-gray-400">
      <div class="w-8 h-8 rounded-full mx-auto mb-3 animate-spin" style="border: 3px solid var(--tf-border); border-top-color: var(--tf-accent-emerald);"></div>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link v-for="category in categories" :key="category.id" :to="`/categories/${category.id}`" 
            class="card-static shadow hover:-translate-y-1 transition-all relative group overflow-hidden flex flex-col justify-end min-h-[240px] p-6" 
            style="text-decoration: none; border-radius: var(--tf-radius-xl); color: inherit;">
            
            <!-- Dynamic Background Grid -->
            <div class="absolute inset-0 z-0 bg-gray-900 transition-transform duration-500 group-hover:scale-105">
                <div v-if="getCategoryThumbnails(category).length > 0" class="w-full h-full grid gap-[1px]"
                    :class="{
                        'grid-cols-1': getCategoryThumbnails(category).length === 1,
                        'grid-cols-2': getCategoryThumbnails(category).length > 1,
                        'grid-rows-1': getCategoryThumbnails(category).length <= 2,
                        'grid-rows-2': getCategoryThumbnails(category).length > 2
                    }">
                    <img v-for="(thumb, i) in getCategoryThumbnails(category)" :key="i" 
                        :src="getThumbnailUrl(thumb)" 
                        alt=""
                        class="w-full h-full object-cover" 
                        :class="{ 'col-span-2': getCategoryThumbnails(category).length === 3 && i === 0 }" />
                </div>
                <div v-else class="w-full h-full" :style="`background: linear-gradient(135deg, hsl(${(category.id?.charCodeAt?.(0) || 0) * 43 % 360}, 60%, 25%), hsl(${(category.id?.charCodeAt?.(0) || 0) * 43 % 360 + 60}, 50%, 15%));`"></div>
                <!-- Gradient overlay -->
                <div class="absolute inset-0" style="background: linear-gradient(to top, rgba(15, 14, 23, 0.95) 0%, rgba(15, 14, 23, 0.4) 100%);"></div>
                <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style="background: linear-gradient(to top, rgba(16,185,129,0.15) 0%, transparent 60%);"></div>
            </div>
            
            <div class="relative z-10 mt-auto">
                <h2 class="text-2xl font-heading font-bold mb-3 drop-shadow-md text-white group-hover:text-emerald-300 transition-colors duration-300">{{ getLocalized(category.name) }}</h2>
            
            <!-- Stats -->
            <div class="flex items-center gap-4 text-sm font-medium" style="color: rgba(255,255,255,0.8);">
                <span class="flex items-center gap-1.5" :title="$t('categories.courses_count') || 'Courses'">
                    🎬 <span class="text-white">{{ category.clips_count || 0 }}</span>
                </span>
                <span class="flex items-center gap-1.5 drop-shadow-md" :title="$t('categories.total_views') || 'Total views'">
                    👁️ <span class="text-white">{{ category.clips_sum_views || 0 }}</span>
                </span>
            </div>
            </div>
        </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api';
import { useTranslation } from '../composables/useTranslation';
import { useMediaUrl } from '../composables/useMediaUrl';

const { getTranslated: getLocalized } = useTranslation();
const { getThumbnailUrl } = useMediaUrl();

interface Category {
    id: string;
    name: { en: string; pl?: string; es?: string };
    slug: { en: string; pl?: string; es?: string };
    clips_count?: number;
    clips_sum_views?: number;
    total_subclips_count?: number;
    popular_clips?: any[];
}

const categories = ref<Category[]>([]);
const loading = ref(true);

const getCategoryThumbnails = (category: Category) => {
    if (!category.popular_clips || category.popular_clips.length === 0) return [];
    return category.popular_clips
        .map(clip => clip.thumbnails?.[0])
        .filter(Boolean)
        .slice(0, 4);
};

const fetchCategories = async () => {
    loading.value = true;
    try {
        const response = await api.get('/api/categories');
        categories.value = response.data;
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

onMounted(fetchCategories);
</script>
