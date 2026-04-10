<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue';
import IconPlayMovie from './icons/IconPlayMovie.vue';

const props = defineProps<{
  nextItemName: string | null;
  isLastItem: boolean;
  autoPlayDelay: number;
  isCourseComplete: boolean;
}>();

const emit = defineEmits<{
  (e: 'play-next'): void;
  (e: 'replay'): void;
  (e: 'dismiss'): void;
}>();

const countdown = ref(props.autoPlayDelay);
let intervalId: ReturnType<typeof setInterval> | null = null;

const progressPercent = computed(() =>
  ((props.autoPlayDelay - countdown.value) / props.autoPlayDelay) * 100,
);

const circumference = 2 * Math.PI * 22; // r=22

const startCountdown = () => {
  if (props.isLastItem || props.isCourseComplete) return;
  countdown.value = props.autoPlayDelay;
  intervalId = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearTimer();
      emit('play-next');
    }
  }, 1000);
};

const clearTimer = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

// Start countdown on mount
startCountdown();

onUnmounted(() => clearTimer());

// Reset if props change
watch(() => props.nextItemName, () => {
  clearTimer();
  startCountdown();
});
</script>

<template>
  <div class="playnext-overlay" @click.self="emit('dismiss')">
    <div class="playnext-content">

      <!-- Completed course state -->
      <template v-if="isCourseComplete">
        <div class="text-5xl mb-4">🏆</div>
        <h3 class="text-2xl font-heading font-extrabold gradient-text mb-2">
          {{ $t('course.course_complete') }}
        </h3>
        <p class="text-sm mb-6" style="color: var(--tf-text-muted);">
          {{ $t('course.course_complete_desc') }}
        </p>
        <button class="playnext-btn playnext-btn--replay" @click="emit('replay')">
          🔄 {{ $t('course.replay') }}
        </button>
      </template>

      <!-- Last item (no next video) -->
      <template v-else-if="isLastItem">
        <div class="text-5xl mb-4">✅</div>
        <h3 class="text-xl font-heading font-bold mb-2" style="color: var(--tf-text);">
          {{ $t('course.clip_completed') }}
        </h3>
        <p class="text-sm mb-6" style="color: var(--tf-text-muted);">
          {{ $t('course.course_complete_desc') }}
        </p>
        <button class="playnext-btn playnext-btn--replay" @click="emit('replay')">
          🔄 {{ $t('course.replay') }}
        </button>
      </template>

      <!-- Normal: play next -->
      <template v-else>
        <div class="text-4xl mb-3">✅</div>
        <p class="text-sm font-semibold mb-1" style="color: var(--tf-accent-emerald);">
          {{ $t('course.clip_completed') }}
        </p>
        <p class="text-xs mb-5" style="color: var(--tf-text-muted);">
          {{ nextItemName }}
        </p>

        <!-- Countdown ring + Play Next button -->
        <div class="playnext-ring-wrap mb-4" @click="emit('play-next')">
          <svg class="playnext-ring" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" />
            <circle
              cx="24" cy="24" r="22"
              fill="none"
              stroke="url(#ringGrad)"
              stroke-width="3"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="circumference - (circumference * progressPercent / 100)"
              class="playnext-ring-progress"
            />
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#6ee7b7" />
                <stop offset="100%" stop-color="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div class="playnext-ring-inner">
            <IconPlayMovie :size="24" style="color: var(--tf-accent-emerald);" />
          </div>
        </div>

        <button class="playnext-btn playnext-btn--next" @click="emit('play-next')">
          ▶ {{ $t('course.play_next') }}
        </button>

        <p class="text-xs mt-3" style="color: var(--tf-text-dimmed);">
          {{ $t('course.play_next_countdown', { seconds: countdown }) }}
        </p>

        <button class="playnext-link mt-3" @click="emit('replay')">
          {{ $t('course.replay') }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.playnext-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 14, 23, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: playnextFadeIn 0.3s ease-out;
  cursor: default;
}

.playnext-content {
  text-align: center;
  max-width: 340px;
  animation: playnextSlideUp 0.35s ease-out;
}

.playnext-ring-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0 auto;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.playnext-ring-wrap:hover {
  transform: scale(1.08);
}

.playnext-ring {
  width: 72px;
  height: 72px;
  transform: rotate(-90deg);
}

.playnext-ring-progress {
  transition: stroke-dashoffset 0.95s linear;
}

.playnext-ring-inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.playnext-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.625rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  font-family: var(--tf-font-heading, inherit);
  cursor: pointer;
  border: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.playnext-btn:hover {
  transform: translateY(-2px);
}

.playnext-btn--next {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.35), 0 4px 12px rgba(0, 0, 0, 0.25);
}

.playnext-btn--next:hover {
  box-shadow: 0 0 32px rgba(16, 185, 129, 0.55), 0 6px 18px rgba(0, 0, 0, 0.3);
}

.playnext-btn--replay {
  background: rgba(255, 255, 255, 0.08);
  color: var(--tf-text-muted);
  border: 1px solid var(--tf-border);
}

.playnext-btn--replay:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--tf-text);
}

.playnext-link {
  background: none;
  border: none;
  color: var(--tf-text-dimmed);
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.15s;
}

.playnext-link:hover {
  color: var(--tf-text-muted);
}

@keyframes playnextFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes playnextSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
