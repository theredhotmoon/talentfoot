<script setup lang="ts">
import { useTranslation } from '../composables/useTranslation';
import { useMediaUrl } from '../composables/useMediaUrl';
import type { Clip, Subclip } from '../types';

const props = defineProps<{
  clip: Clip;
  activeSubclipId: string | null;
  watchedIds: string[];
  startedIds: string[];
  mainClipWatched?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select-main'): void;
  (e: 'select-subclip', subclip: Subclip): void;
}>();

const { getTranslated } = useTranslation();
const { getThumbnailUrl } = useMediaUrl();
</script>

<template>
  <!-- Desktop only — sticky vertical list -->
  <div class="hidden lg:block card-static p-4 lg:w-64 lg:flex-shrink-0 subclips-sidebar"
       style="border-radius: var(--tf-radius-xl); position: sticky; top: 5rem; max-height: calc(100vh - 6rem); overflow-y: auto;">
    <h2 class="text-lg font-heading font-bold mb-3" style="color: var(--tf-text);">{{ $t('subclips.title') }}</h2>
    <div class="flex flex-col gap-3">

      <!-- Main clip card -->
      <div
        @click="emit('select-main')"
        :class="[
          'w-full rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2',
          !activeSubclipId ? 'border-blue-500 shadow-lg shadow-blue-500/30' : 'border-transparent hover:border-white/20',
        ]"
      >
        <div class="relative w-full h-24" style="background: rgba(255,255,255,0.04);">
          <img v-if="clip.thumbnails?.length" :src="getThumbnailUrl(clip.thumbnails[0])" class="w-full h-full object-cover" loading="lazy" alt="Main clip" />
          <span v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">▶ Main</span>
          <div v-if="!activeSubclipId" class="absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded-full font-semibold" style="background: var(--tf-gradient-primary); color: #0f0e17;">
            {{ $t('subclips.now_playing') }}
          </div>
          <div v-if="mainClipWatched" class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
               style="background: rgba(110,231,183,0.25); color: var(--tf-accent-emerald);">✅</div>
        </div>
        <div class="p-2" style="background: rgba(0,0,0,0.3);">
          <p class="text-xs font-semibold truncate">{{ getTranslated(clip.name) }}</p>
          <div class="flex justify-between text-[10px]" style="color: var(--tf-text-dimmed);">
            <span>⭐ {{ clip.difficulty }}/10</span>
            <span>👁 {{ clip.views }}</span>
          </div>
        </div>
      </div>

      <!-- Subclip cards -->
      <div
        v-for="subclip in clip.subclips"
        :key="'desktop-' + subclip.id"
        @click="emit('select-subclip', subclip)"
        :class="[
          'w-full rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2',
          activeSubclipId === subclip.id ? 'border-blue-500 shadow-lg shadow-blue-500/30' : 'border-transparent hover:border-white/20',
        ]"
      >
        <div class="relative w-full h-24" style="background: rgba(255,255,255,0.04);">
          <img v-if="subclip.thumbnails?.length" :src="getThumbnailUrl(subclip.thumbnails[0])" class="w-full h-full object-cover" loading="lazy" alt="" />
          <span v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-3xl">▶</span>
          <div v-if="activeSubclipId === subclip.id" class="absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded-full font-semibold" style="background: var(--tf-gradient-primary); color: #0f0e17;">
            {{ $t('subclips.now_playing') }}
          </div>
          <div v-if="watchedIds.includes(subclip.id)" class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
               style="background: rgba(110,231,183,0.25); color: var(--tf-accent-emerald);">✅</div>
          <div v-else-if="startedIds.includes(subclip.id)" class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
               style="background: rgba(251,191,36,0.25); color: var(--tf-accent-amber);">▶</div>
          <div v-else class="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-semibold"
               :style="subclip.is_preview ? 'background: rgba(110,231,183,0.2); color: var(--tf-accent-emerald);' : 'background: rgba(255,255,255,0.15); color: var(--tf-text-muted);'">
            {{ subclip.is_preview ? '👁' : '🔒' }}
          </div>
        </div>
        <div class="p-2" style="background: rgba(0,0,0,0.3);">
          <p class="text-xs font-semibold truncate">{{ getTranslated(subclip.name) }}</p>
          <div class="flex justify-between text-[10px]" style="color: var(--tf-text-dimmed);">
            <span>⭐ {{ subclip.difficulty }}/10</span>
            <span>👁 {{ subclip.views }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
