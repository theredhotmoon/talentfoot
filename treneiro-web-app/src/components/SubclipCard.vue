<script setup lang="ts">
import { useMediaUrl } from '../composables/useMediaUrl';
import type { Subclip } from '../types';

const props = defineProps<{
  subclip: Subclip;
  isActive: boolean;
  isWatched: boolean;
  isStarted: boolean;
  /** show the main clip thumbnail card style or subclip */
  layout?: 'mobile' | 'desktop';
}>();

defineEmits<{ (e: 'select', subclip: Subclip): void }>();

const { getThumbnailUrl } = useMediaUrl();
</script>

<template>
  <div
    @click="$emit('select', subclip)"
    :class="[
      'rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2 flex-shrink-0',
      layout === 'mobile' ? 'w-44' : 'w-full',
      isActive
        ? 'border-emerald-400 shadow-lg shadow-emerald-400/20'
        : 'border-transparent hover:border-white/20',
    ]"
  >
    <!-- Thumbnail -->
    <div class="relative" :class="layout === 'mobile' ? 'w-44 h-24' : 'w-full h-24'" style="background: rgba(255,255,255,0.04);">
      <img
        v-if="subclip.thumbnails && subclip.thumbnails.length > 0"
        :src="getThumbnailUrl(subclip.thumbnails[0])"
        class="w-full h-full object-cover"
        loading="lazy"
        alt=""
      />
      <span v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-3xl">▶</span>

      <!-- Active badge -->
      <div v-if="isActive" class="absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded-full font-semibold" style="background: var(--tf-gradient-primary); color: #0f0e17;">
        {{ $t('subclips.now_playing') }}
      </div>
      <!-- Status badge -->
      <div v-if="isWatched" class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
           style="background: rgba(110,231,183,0.25); color: var(--tf-accent-emerald);">✅</div>
      <div v-else-if="isStarted" class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
           style="background: rgba(251,191,36,0.25); color: var(--tf-accent-amber);">▶</div>
      <div v-else class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
           :style="subclip.is_preview ? 'background: rgba(110,231,183,0.2); color: var(--tf-accent-emerald);' : 'background: rgba(255,255,255,0.15); color: var(--tf-text-muted);'">
        {{ subclip.is_preview ? '👁' : '🔒' }}
      </div>
    </div>

    <!-- Info -->
    <div class="p-2" style="background: rgba(0,0,0,0.3);">
      <p class="text-xs font-semibold truncate">{{ $slots.name ? '' : '' }}{{ subclip.name && typeof subclip.name === 'string' ? subclip.name : '' }}</p>
      <slot name="name" />
      <div class="flex justify-between text-[10px]" style="color: var(--tf-text-dimmed);">
        <span>⭐ {{ subclip.difficulty }}/10</span>
        <span>👁 {{ subclip.views }}</span>
      </div>
    </div>
  </div>
</template>
