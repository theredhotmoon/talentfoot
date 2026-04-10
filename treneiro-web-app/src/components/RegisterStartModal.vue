<script setup lang="ts">
import { computed } from 'vue';
import RegisterForm from './RegisterForm.vue';
import CourseHowTo from './CourseHowTo.vue';
import ClipStatsGrid from './ClipStatsGrid.vue';
import { useTranslation } from '../composables/useTranslation';
import { useMediaUrl } from '../composables/useMediaUrl';
import type { Clip } from '../types';

const props = defineProps<{
  clip?: Clip | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { getTranslated } = useTranslation();
const { getThumbnailUrl } = useMediaUrl();

const hasCourseDetails = computed(() => !!props.clip);

const thumbnailSrc = computed(() => {
  const t = props.clip?.thumbnails?.[0];
  return t ? getThumbnailUrl(t) : null;
});

const clipName = computed(() =>
  props.clip ? getTranslated(props.clip.name) : '',
);

const clipDescription = computed(() =>
  props.clip?.description ? getTranslated(props.clip.description) : '',
);

const handleSuccess = () => {
  emit('close');
};
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('close')"></div>

      <!-- Modal Content -->
      <div class="relative w-full max-w-4xl" style="animation: modalSlideUp 0.3s ease-out;">
        <div class="card-static overflow-hidden relative flex flex-col md:flex-row" style="border-radius: var(--tf-radius-2xl); border: 1px solid var(--tf-border);">
          <!-- Close button -->
          <button @click="$emit('close')"
              class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
              style="background: rgba(255,255,255,0.05); color: var(--tf-text-muted);">
              ✕
          </button>

          <!-- Left Column: Course Details (when clip prop provided) OR generic HowTo -->
          <div class="p-8 md:w-1/2 flex flex-col justify-center border-b md:border-b-0 md:border-r" style="border-color: var(--tf-border); background: rgba(0,0,0,0.1);">
            <template v-if="hasCourseDetails">
              <!-- Course thumbnail -->
              <div v-if="thumbnailSrc" class="mb-4 rounded-xl overflow-hidden" style="border: 1px solid var(--tf-border);">
                <img :src="thumbnailSrc" :alt="clipName" class="w-full aspect-video object-cover" />
              </div>

              <!-- Course title -->
              <h1 class="font-heading font-extrabold text-2xl gradient-text mb-2">{{ clipName }}</h1>

              <!-- Course description -->
              <p class="text-sm mb-4 course-desc-clamp" style="color: var(--tf-text-muted);">{{ clipDescription }}</p>

              <!-- Stats row -->
              <div v-if="clip" class="mb-4">
                <ClipStatsGrid
                  :difficulty="clip.difficulty"
                  :views="clip.views"
                  :rating="clip.average_rating ? Number(clip.average_rating).toFixed(1) : '-'"
                  :ratings-count="clip.ratings_count"
                  :subclips-count="clip.subclips_count ?? clip.subclips?.length ?? 0"
                  :participants-count="clip.challenges_count"
                />
              </div>

              <!-- Register CTA text -->
              <p class="text-xs" style="color: var(--tf-text-dimmed);">{{ $t('auth.register_to_access_desc') }}</p>
            </template>

            <template v-else>
              <div class="text-center md:text-left mb-6">
                <span class="text-3xl">⚽</span>
                <h1 class="font-heading font-extrabold text-2xl gradient-text mt-2">{{ $t('auth.register_to_access_title') }}</h1>
                <p class="text-sm mt-1" style="color: var(--tf-text-muted);">{{ $t('auth.register_to_access_desc') }}</p>
              </div>
              <CourseHowTo :main-clip-watched="false" :subscription-active="false" :hide-cta="true" />
            </template>
          </div>

          <!-- Right Column: Registration Form -->
          <div class="p-8 md:w-1/2 relative bg-surface">
            <div class="text-center mb-6">
              <h2 class="font-heading font-bold text-xl">{{ $t('register.title') }}</h2>
            </div>

            <RegisterForm :redirect="false" @success="handleSuccess" />

            <p class="mt-6 text-sm text-center" style="color: var(--tf-text-muted);">
              {{ $t('register.has_account') }}
              <router-link to="/login" @click="$emit('close')" class="font-semibold transition-colors" style="color: var(--tf-accent-violet);">
                {{ $t('register.login_link') }}
              </router-link>
            </p>
          </div>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.bg-surface {
  background: var(--tf-bg-surface-solid, #121212);
}
.course-desc-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-clamp: 3;
  overflow: hidden;
}
</style>
