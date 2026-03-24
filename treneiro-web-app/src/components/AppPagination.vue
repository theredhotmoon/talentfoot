<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  currentPage: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  (e: 'update:currentPage', value: number): void;
}>();

const pages = computed(() => {
  const range = [];
  const start = Math.max(1, props.currentPage - 2);
  const end = Math.min(props.totalPages, props.currentPage + 2);

  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:currentPage', page);
  }
};
</script>

<template>
  <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-8">
    <!-- Previous button -->
    <button
      @click="goToPage(currentPage - 1)"
      :disabled="currentPage === 1"
      class="h-10 px-4 rounded-full flex items-center justify-center font-medium transition-all duration-200 border"
      :class="currentPage === 1 ? 'opacity-50 cursor-not-allowed border-transparent bg-white/5 text-gray-500' : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white'"
    >
      &larr;
    </button>

    <!-- Page numbers -->
    <template v-if="pages.length > 0 && pages[0]! > 1">
      <button @click="goToPage(1)" class="w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-200 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300">1</button>
      <span v-if="pages[0]! > 2" class="text-gray-500 px-1">...</span>
    </template>

    <button
      v-for="p in pages"
      :key="p"
      @click="goToPage(p)"
      class="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-200 border"
      :class="p === currentPage ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-300'"
    >
      {{ p }}
    </button>

    <template v-if="pages.length > 0 && pages[pages.length - 1]! < totalPages">
      <span v-if="pages[pages.length - 1]! < totalPages - 1" class="text-gray-500 px-1">...</span>
      <button @click="goToPage(totalPages)" class="w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-200 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300">{{ totalPages }}</button>
    </template>

    <!-- Next button -->
    <button
      @click="goToPage(currentPage + 1)"
      :disabled="currentPage === totalPages"
      class="h-10 px-4 rounded-full flex items-center justify-center font-medium transition-all duration-200 border"
      :class="currentPage === totalPages ? 'opacity-50 cursor-not-allowed border-transparent bg-white/5 text-gray-500' : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white'"
    >
      &rarr;
    </button>
  </div>
</template>
