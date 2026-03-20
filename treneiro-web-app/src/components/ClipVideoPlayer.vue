<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMediaUrl } from '../composables/useMediaUrl';

const props = defineProps<{
  filePath: string;
  cartoonFilePath: string | null;
  captions: Record<string, string>;
  activeSubclipName: string | null;
  hasSubclips: boolean;
  subscriptionActive: boolean;
}>();

const emit = defineEmits<{
  (e: 'play'): void;
  (e: 'pause'): void;
  (e: 'ended'): void;
  (e: 'back-to-main'): void;
}>();

const { locale } = useI18n();
const { getVideoUrl, getCaptionUrl } = useMediaUrl();

const videoEl = ref<HTMLVideoElement | null>(null);
const showCartoon = ref(false);
const captionsEnabled = ref(true);
const selectedCaptionLang = ref('');

watch(
  () => locale.value,
  (val) => { if (!selectedCaptionLang.value) selectedCaptionLang.value = val; },
  { immediate: true },
);

const currentSrc = computed(() =>
  showCartoon.value && props.cartoonFilePath
    ? getVideoUrl(props.cartoonFilePath)
    : getVideoUrl(props.filePath),
);

const getLanguageLabel = (lang: string) => {
  const labels: Record<string, string> = { en: 'English', pl: 'Polski', es: 'Español' };
  return labels[lang] ?? lang.toUpperCase();
};

const toggleCaptions = () => {
  captionsEnabled.value = !captionsEnabled.value;
  if (!videoEl.value) return;
  for (const track of Array.from(videoEl.value.textTracks)) {
    track.mode = captionsEnabled.value
      ? track.language === selectedCaptionLang.value ? 'showing' : 'hidden'
      : 'disabled';
  }
};

const applyCaptionLang = () => {
  if (!videoEl.value || !captionsEnabled.value) return;
  for (const track of Array.from(videoEl.value.textTracks)) {
    track.mode = track.language === selectedCaptionLang.value ? 'showing' : 'hidden';
  }
};

// Expose the video element so the parent can call .play() for autoplay
defineExpose({ videoEl });
</script>

<template>
  <div class="card-static overflow-hidden" style="border-radius: var(--tf-radius-xl);">
    <!-- Subscription gated -->
    <template v-if="!subscriptionActive">
      <div class="flex flex-col items-center justify-center py-16 px-6" style="background: var(--tf-bg-surface-solid);">
        <div class="text-5xl mb-4">🔒</div>
        <h2 class="text-2xl font-heading font-bold mb-2" style="color: var(--tf-text);">{{ $t('subscription.renew_title') }}</h2>
        <p class="text-center max-w-md" style="color: var(--tf-text-muted);">{{ $t('subscription.renew_message') }}</p>
      </div>
    </template>

    <template v-else>
      <!-- Cartoon / Original toggle -->
      <div v-if="cartoonFilePath" class="px-4 py-2 flex items-center justify-center gap-3" style="background: rgba(255,255,255,0.04); border-bottom: 1px solid var(--tf-border);">
        <button
          @click="showCartoon = false"
          class="px-3 py-1 rounded-full text-sm font-medium transition"
          :style="!showCartoon ? 'background: var(--tf-gradient-primary); color: #0f0e17;' : 'background: rgba(255,255,255,0.06); color: var(--tf-text-muted);'"
        >{{ $t('cartoon.view_original') }}</button>
        <button
          @click="showCartoon = true"
          class="px-3 py-1 rounded-full text-sm font-medium transition"
          :style="showCartoon ? 'background: var(--tf-gradient-secondary); color: white;' : 'background: rgba(255,255,255,0.06); color: var(--tf-text-muted);'"
        >🎨 {{ $t('cartoon.view_cartoon') }}</button>
      </div>

      <!-- Now playing bar -->
      <div v-if="activeSubclipName" class="px-4 py-2 flex items-center justify-between" style="background: rgba(110,231,183,0.1); border-bottom: 1px solid rgba(110,231,183,0.2);">
        <span class="text-sm font-semibold" style="color: var(--tf-accent-emerald);">
          {{ $t('subclips.now_playing') }}: {{ activeSubclipName }}
        </span>
        <button @click="emit('back-to-main')" class="btn-ghost text-xs py-1 px-3">
          {{ $t('subclips.back_to_main') }}
        </button>
      </div>
      <div v-else-if="hasSubclips" class="px-4 py-2 flex items-center" style="background: rgba(99,102,241,0.08); border-bottom: 1px solid rgba(99,102,241,0.15);">
        <span class="text-sm font-semibold" style="color: var(--tf-accent-violet);">🎯 {{ $t('course.overview_heading') }}</span>
      </div>

      <!-- Video + captions overlay -->
      <div class="relative group/captions">
        <video
          ref="videoEl"
          :src="currentSrc"
          controls
          crossorigin="anonymous"
          class="w-full max-h-[600px] object-contain bg-black"
          @play="emit('play')"
          @pause="emit('pause')"
          @ended="emit('ended')"
        >
          <track
            v-for="(path, lang) in captions"
            :key="`${filePath}-${lang}`"
            :src="getCaptionUrl(path)"
            :srclang="String(lang)"
            :label="getLanguageLabel(String(lang))"
            :default="String(lang) === locale"
          />
        </video>

        <!-- Captions overlay (hover) -->
        <div v-if="Object.keys(captions).length > 0"
             class="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover/captions:opacity-100 transition-opacity duration-300 z-10">
          <select v-if="captionsEnabled" v-model="selectedCaptionLang" @change="applyCaptionLang"
                  class="text-xs py-1 px-2 rounded-lg cursor-pointer"
                  style="background: rgba(0,0,0,0.7); color: white; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(8px);">
            <option v-for="(_path, lang) in captions" :key="lang" :value="lang">{{ getLanguageLabel(String(lang)) }}</option>
          </select>
          <button
            @click="toggleCaptions"
            class="px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            style="backdrop-filter: blur(8px);"
            :style="captionsEnabled
              ? 'background: rgba(110,231,183,0.25); color: #6ee7b7; border: 1px solid rgba(110,231,183,0.4);'
              : 'background: rgba(0,0,0,0.6); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.15);'"
          >
            <span>{{ captionsEnabled ? '💬' : '🔇' }}</span>
            {{ captionsEnabled ? $t('captions.on') : $t('captions.off') }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
