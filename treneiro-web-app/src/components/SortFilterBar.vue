<script setup lang="ts">
import { useTranslation } from '../composables/useTranslation';

const { getTranslated } = useTranslation();

defineProps<{
    categories: any[];
    modelSortBy: string;
    modelSortOrder: string;
    modelSelectedCategory: string;
    hideCategoryFilter?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelSortBy', value: string): void;
    (e: 'update:modelSortOrder', value: string): void;
    (e: 'update:modelSelectedCategory', value: string): void;
    (e: 'change'): void;
}>();

const onSortByChange = (event: Event) => {
    emit('update:modelSortBy', (event.target as HTMLSelectElement).value);
    emit('change');
};

const onSortOrderChange = (event: Event) => {
    emit('update:modelSortOrder', (event.target as HTMLSelectElement).value);
    emit('change');
};

const onCategoryChange = (event: Event) => {
    emit('update:modelSelectedCategory', (event.target as HTMLSelectElement).value);
    emit('change');
};
</script>

<template>
    <div class="flex gap-2 flex-wrap">
        <select v-if="!hideCategoryFilter" :value="modelSelectedCategory" @change="onCategoryChange" class="select-modern max-w-[150px]">
            <option value="">{{ $t('dashboard.all_categories') || 'All Categories' }}</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ getTranslated(cat.name) }}
            </option>
        </select>
        <select :value="modelSortBy" @change="onSortByChange" class="select-modern">
            <option value="created_at">{{ $t('sort.date') }}</option>
            <option value="average_rating">{{ $t('sort.rating') }}</option>
            <option value="difficulty">{{ $t('sort.difficulty') }}</option>
            <option value="views">{{ $t('sort.views') }}</option>
            <option value="comments_count">{{ $t('sort.comments') }}</option>
        </select>
        <select :value="modelSortOrder" @change="onSortOrderChange" class="select-modern">
            <option value="desc">{{ $t('sort.desc') }}</option>
            <option value="asc">{{ $t('sort.asc') }}</option>
        </select>
    </div>
</template>
