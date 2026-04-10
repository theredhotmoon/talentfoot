<script setup lang="ts">
import IconBook from './icons/IconBook.vue';
import IconPlayMovie from './icons/IconPlayMovie.vue';
import IconEye from './icons/IconEye.vue';
import IconLightning from './icons/IconLightning.vue';
import IconCheck from './icons/IconCheck.vue';
import { useMediaUrl } from '../composables/useMediaUrl';
import { useTranslation } from '../composables/useTranslation';
import type { Subclip } from '../types';

const props = defineProps<{
  clipName: string;
  clipDescription: string;
  subclipsCount: number;
  difficulty: number;
  previewSubclips?: Subclip[];
}>();

const emit = defineEmits<{
  (e: 'watch-preview'): void;
  (e: 'start-course'): void;
  (e: 'select-subclip', subclip: Subclip): void;
}>();

const { getThumbnailUrl } = useMediaUrl();
const { getTranslated } = useTranslation();
</script>

<template>
  <div class="cover-overlay">
    <div class="cover-content">
      <!-- Course title -->
      <h2 class="text-3xl md:text-4xl font-heading font-extrabold gradient-text mb-3 leading-tight">
        {{ clipName }}
      </h2>

      <!-- Description -->
      <p class="text-sm mb-6 cover-description" style="color: var(--tf-text-muted);">
        {{ clipDescription }}
      </p>

      <!-- How it works block -->
      <div class="cover-howto mb-6">
        <p class="font-semibold text-sm mb-3 flex items-center gap-2" style="color: var(--tf-accent-violet);">
          <IconBook :size="16" /> {{ $t('course.how_it_works') }}
        </p>
        <ul class="text-xs space-y-2" style="color: var(--tf-text-muted);">
          <li class="flex items-center gap-2"><IconPlayMovie :size="14" /> {{ $t('course.step_watch_main') }}</li>
          <li class="flex items-center gap-2"><IconEye :size="14" /> {{ $t('course.step_preview') }}</li>
          <li class="flex items-center gap-2"><IconLightning :size="14" /> {{ $t('course.step_start') }}</li>
          <li class="flex items-center gap-2"><IconCheck :size="14" /> {{ $t('course.step_complete') }}</li>
        </ul>
      </div>

      <!-- Stats row -->
      <div class="flex items-center justify-center gap-4 mb-8 text-xs" style="color: var(--tf-text-muted);">
        <span class="flex items-center gap-1.5">
          <IconBook :size="14" /> <span style="color: var(--tf-accent-violet);">{{ subclipsCount }}</span> {{ $t('dashboard.subclips') }}
        </span>
        <span class="flex items-center gap-1.5">
          ⭐ <span style="color: var(--tf-accent-amber);">{{ difficulty }}/10</span> {{ $t('dashboard.difficulty') }}
        </span>
      </div>

      <!-- CTA buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <button
          id="cover-watch-preview-btn"
          class="cover-btn cover-btn--preview w-full sm:w-auto"
          @click="emit('watch-preview')"
        >
          <IconPlayMovie :size="18" />
          {{ $t('course.cover_watch_preview') }}
        </button>
        <button
          id="cover-start-course-btn"
          class="cover-btn cover-btn--start w-full sm:w-auto"
          @click="emit('start-course')"
        >
          <IconLightning :size="18" />
          {{ $t('course.cover_start_course') }}
        </button>
      </div>

      <!-- Preview subclips (logged-in users without a challenge) -->
      <div v-if="props.previewSubclips && props.previewSubclips.length > 0" class="cover-preview-list mt-6">
        <p class="text-xs font-semibold mb-3 flex items-center gap-1.5" style="color: var(--tf-accent-emerald);">
          <IconEye :size="13" /> {{ $t('subclips.preview_available') }}
        </p>
        <ul class="space-y-2">
          <li
            v-for="sub in props.previewSubclips"
            :key="sub.id"
            class="preview-item"
            @click="emit('select-subclip', sub)"
          >
            <!-- Thumbnail -->
            <div class="preview-thumb">
              <img
                v-if="sub.thumbnails?.[0]"
                :src="getThumbnailUrl(sub.thumbnails[0])"
                :alt="getTranslated(sub.name)"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center" style="background: rgba(99,102,241,0.12);">
                <IconPlayMovie :size="16" style="color: var(--tf-accent-violet);" />
              </div>
            </div>
            <!-- Name -->
            <span class="flex-1 text-sm truncate" style="color: var(--tf-text-muted);">{{ getTranslated(sub.name) }}</span>
            <!-- Play icon -->
            <span class="preview-play">
              <IconPlayMovie :size="14" />
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cover-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 14, 23, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 1.5rem;
}

.cover-content {
  max-width: 520px;
  width: 100%;
  text-align: center;
  animation: coverFadeIn 0.4s ease-out;
}

.cover-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 440px;
  margin-left: auto;
  margin-right: auto;
}

.cover-howto {
  text-align: left;
  padding: 1rem 1.25rem;
  border-radius: var(--tf-radius-lg, 12px);
  background: rgba(99, 102, 241, 0.06);
  border: 1px solid rgba(99, 102, 241, 0.15);
  max-width: 440px;
  margin-left: auto;
  margin-right: auto;
}

.cover-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.75rem;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 700;
  font-family: var(--tf-font-heading, inherit);
  letter-spacing: 0.01em;
  cursor: pointer;
  border: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.cover-btn:hover {
  transform: translateY(-2px);
  opacity: 0.93;
}

.cover-btn:active {
  transform: translateY(0);
}

.cover-btn--preview {
  background: linear-gradient(135deg, #818cf8, #06b6d4);
  color: white;
  box-shadow: 0 0 20px rgba(129, 140, 248, 0.3), 0 4px 12px rgba(0, 0, 0, 0.25);
}

.cover-btn--preview:hover {
  box-shadow: 0 0 32px rgba(129, 140, 248, 0.5), 0 6px 18px rgba(0, 0, 0, 0.3);
}

.cover-btn--start {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.3), 0 4px 12px rgba(0, 0, 0, 0.25);
}

.cover-btn--start:hover {
  box-shadow: 0 0 32px rgba(16, 185, 129, 0.5), 0 6px 18px rgba(0, 0, 0, 0.3);
}

@keyframes coverFadeIn {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Preview subclips list */
.cover-preview-list {
  max-width: 440px;
  margin-left: auto;
  margin-right: auto;
  max-height: 180px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(99,102,241,0.3) transparent;
  text-align: left;
}

.cover-preview-list::-webkit-scrollbar {
  width: 4px;
}

.cover-preview-list::-webkit-scrollbar-thumb {
  background: rgba(99,102,241,0.35);
  border-radius: 2px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.625rem;
  cursor: pointer;
  transition: background 0.15s ease;
  border: 1px solid rgba(110,231,183,0.1);
  background: rgba(110,231,183,0.04);
  list-style: none;
}

.preview-item:hover {
  background: rgba(110,231,183,0.1);
  border-color: rgba(110,231,183,0.25);
}

.preview-thumb {
  flex-shrink: 0;
  width: 48px;
  height: 30px;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0,0,0,0.3);
}

.preview-play {
  flex-shrink: 0;
  color: var(--tf-accent-emerald);
  opacity: 0.7;
  transition: opacity 0.15s;
}

.preview-item:hover .preview-play {
  opacity: 1;
}
</style>
