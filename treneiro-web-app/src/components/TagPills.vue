<script setup lang="ts">
import { useTranslation } from '../composables/useTranslation';

const { getTranslated } = useTranslation();

defineProps<{
    tags: { id: string; name: any; slug?: any }[];
}>();
</script>

<template>
    <div class="flex flex-wrap gap-2 mb-4" v-if="tags && tags.length > 0">
        <router-link
            v-for="t in tags"
            :key="t.id"
            :to="`/tags/${t.id}`"
            class="tag-pill"
        >
            {{ getTranslated(t.name) }}
        </router-link>
    </div>
</template>
