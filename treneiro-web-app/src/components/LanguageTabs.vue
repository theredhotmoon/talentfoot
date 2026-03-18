<script setup lang="ts">
defineProps<{
    modelValue: string;
    size?: 'default' | 'small';
}>();

defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const languages = ['en', 'pl', 'es'];
</script>

<template>
    <div :class="['flex', size === 'small' ? 'space-x-1' : 'space-x-2 border-b border-gray-700 pb-2 mb-4']">
        <button
            type="button"
            v-for="lang in languages"
            :key="lang"
            @click="$emit('update:modelValue', lang)"
            :class="[
                'rounded transition',
                size === 'small'
                    ? ['px-2 py-1 text-xs', modelValue === lang ? 'btn-tag-active' : 'bg-gray-600 text-gray-300']
                    : ['px-4 py-2', modelValue === lang ? 'btn-tag-active' : 'btn-tag-inactive']
            ]"
        >
            {{ lang.toUpperCase() }}
        </button>
    </div>
</template>
