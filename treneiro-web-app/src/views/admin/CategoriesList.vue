<template>
  <div class="">
    <div class="flex justify-between items-center mb-6">
        <div>
            <h1 class="font-heading font-extrabold text-3xl gradient-text">{{ $t('categories.title') }}</h1>
            <p class="text-sm mt-1" style="color: var(--tf-text-muted);">{{ $t('categories.subtitle') }}</p>
        </div>
        <button @click="openCreateModal" class="btn-primary text-sm">
            {{ $t('categories.add_new') }}
        </button>
    </div>

    <div v-if="loading" class="text-center">{{ $t('common.loading') }}</div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link v-for="category in categories" :key="category.id" :to="`/categories/${category.id}`" 
            class="card-static shadow hover:-translate-y-1 transition-all relative group overflow-hidden flex flex-col justify-end min-h-[240px] p-6" 
            style="text-decoration: none; color: inherit;">
            
            <!-- Dynamic Background Grid -->
            <div class="absolute inset-0 z-0 bg-gray-900">
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
                <!-- Gradient overlay -->
                <div class="absolute inset-0" style="background: linear-gradient(to top, rgba(15, 14, 23, 0.95) 0%, rgba(15, 14, 23, 0.4) 100%);"></div>
            </div>
            
            <div class="relative z-10 mt-auto">
                <h2 class="text-2xl font-heading font-bold mb-3 drop-shadow-md">{{ getLocalized(category.name) }}</h2>
            
            <!-- Stats -->
            <div class="flex items-center gap-4 text-xs" style="color: var(--tf-text-muted);">
                <span class="flex items-center gap-1.5" :title="$t('categories.courses_count') || 'Courses'">
                    🎬 <span style="color: var(--tf-accent-cyan);">{{ category.clips_count || 0 }}</span>
                </span>
                <span class="flex items-center gap-1.5" :title="$t('categories.clips_subclips') || 'Clips (with subclips)'">
                    📋 <span style="color: var(--tf-accent-violet);">{{ (category.clips_count || 0) + (category.total_subclips_count || 0) }}</span>
                </span>
                <span class="flex items-center gap-1.5 drop-shadow-md" :title="$t('categories.total_views') || 'Total views'">
                    👁️ <span style="color: var(--tf-accent-amber);">{{ category.clips_sum_views || 0 }}</span>
                </span>
            </div>
            </div>
            
            <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition flex gap-2 z-20">
                <button @click.prevent="openEditModal(category)" class="bg-blue-600 p-2 rounded hover:bg-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button @click.prevent="deleteCategory(category)" class="bg-red-600 p-2 rounded hover:bg-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </router-link>
    </div>

    <!-- Shared Edit/Create Modal -->
    <EditCategoryModal
        v-if="showModal"
        :category="editingCategory"
        :is-create="isCreating"
        @close="showModal = false"
        @saved="fetchCategories"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
        v-if="showDeleteConfirm && categoryToDelete"
        :title="$t('categories.title')"
        :message="$t('categories.confirm_delete')"
        :confirm-label="$t('dashboard.delete') || 'Delete'"
        :cancel-label="$t('common.cancel') || 'Cancel'"
        :danger="true"
        @confirm="confirmDelete"
        @cancel="showDeleteConfirm = false; categoryToDelete = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';
import { useTranslation } from '../../composables/useTranslation';
import { useMediaUrl } from '../../composables/useMediaUrl';
import { useToast } from '../../composables/useToast';
import EditCategoryModal from '../../components/EditCategoryModal.vue';
import ConfirmModal from '../../components/ConfirmModal.vue';

const { getTranslated: getLocalized } = useTranslation();
const { getThumbnailUrl } = useMediaUrl();
const { showToast } = useToast();

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
const showModal = ref(false);
const isCreating = ref(false);
const editingCategory = ref<Category | null>(null);
const showDeleteConfirm = ref(false);
const categoryToDelete = ref<Category | null>(null);

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
        showToast({ title: 'Error', message: 'Failed to load categories', type: 'error' });
    } finally {
        loading.value = false;
    }
};

const openCreateModal = () => {
    isCreating.value = true;
    editingCategory.value = null;
    showModal.value = true;
};

const openEditModal = (category: Category) => {
    isCreating.value = false;
    editingCategory.value = category;
    showModal.value = true;
};

const deleteCategory = async (category: Category) => {
    categoryToDelete.value = category;
    showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
    if (!categoryToDelete.value) return;
    showDeleteConfirm.value = false;
    try {
        await api.delete(`/api/categories/${categoryToDelete.value.id}`);
        categoryToDelete.value = null;
        fetchCategories();
    } catch (e: any) {
        showToast({ title: 'Error', message: e.response?.data?.message || 'Failed to delete category', type: 'error' });
        categoryToDelete.value = null;
    }
};

onMounted(fetchCategories);
</script>
