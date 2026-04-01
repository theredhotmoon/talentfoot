<script setup lang="ts">
import IconBook from './icons/IconBook.vue';
import IconPlayMovie from './icons/IconPlayMovie.vue';
import IconEye from './icons/IconEye.vue';
import IconLightning from './icons/IconLightning.vue';
import IconCheck from './icons/IconCheck.vue';

const props = defineProps<{
  mainClipWatched: boolean;
  subscriptionActive: boolean;
}>();

const emit = defineEmits<{
  (e: 'start-course'): void;
}>();
</script>

<template>
  <div class="mb-4 rounded-xl overflow-hidden" style="border: 1px solid rgba(99,102,241,0.2);">

    <!-- Header -->
    <div class="p-4" style="background: rgba(99,102,241,0.08);">
      <p class="font-semibold text-sm mb-2 flex items-center gap-2" style="color: var(--tf-accent-violet);">
        <IconBook :size="16" /> {{ $t('course.how_it_works') }}
      </p>
      <ul class="text-xs space-y-2" style="color: var(--tf-text-muted);">
        <li class="flex items-center gap-2"><IconPlayMovie :size="14" /> {{ $t('course.step_watch_main') }}</li>
        <li class="flex items-center gap-2"><IconEye :size="14" /> {{ $t('course.step_preview') }}</li>
        <li class="flex items-center gap-2"><IconLightning :size="14" /> {{ $t('course.step_start') }}</li>
        <li class="flex items-center gap-2"><IconCheck :size="14" /> {{ $t('course.step_complete') }}</li>
      </ul>
    </div>

    <!-- CTA — main clip already watched: ready state -->
    <div v-if="props.mainClipWatched && props.subscriptionActive" class="p-4" style="background: rgba(16,185,129,0.06); border-top: 1px solid rgba(16,185,129,0.15);">
      <p class="text-xs mb-3 flex items-center gap-2 font-medium" style="color: var(--tf-accent-emerald);">
        <span>✅</span> {{ $t('course.ready_to_start') }}
      </p>
      <button
        id="start-course-btn"
        class="course-start-btn course-start-btn--ready w-full"
        @click="emit('start-course')"
      >
        <IconLightning :size="18" />
        {{ $t('course.start_btn') }}
      </button>
    </div>

    <!-- CTA — main clip NOT yet watched (or no subscription): pending state -->
    <div v-else class="p-4" style="background: rgba(99,102,241,0.04); border-top: 1px solid rgba(99,102,241,0.12);">
      <p class="text-xs mb-3 flex items-start gap-2" style="color: var(--tf-text-muted);">
        <span class="mt-px">🎬</span>
        <span>{{ $t('course.watch_first_hint') }}</span>
      </p>
      <button
        id="start-course-btn-pending"
        class="course-start-btn course-start-btn--pending w-full"
        @click="emit('start-course')"
      >
        <IconLightning :size="18" />
        {{ $t('course.start_btn') }}
      </button>
    </div>

  </div>
</template>

<style scoped>
.course-start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  font-family: var(--tf-font-heading, inherit);
  letter-spacing: 0.01em;
  cursor: pointer;
  border: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.course-start-btn:hover {
  transform: translateY(-2px);
  opacity: 0.93;
}

.course-start-btn:active {
  transform: translateY(0);
}

/* Ready: vibrant emerald gradient, pulsing glow */
.course-start-btn--ready {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.35), 0 4px 12px rgba(0, 0, 0, 0.25);
  animation: pulse-glow 2.5s ease-in-out infinite;
}

.course-start-btn--ready:hover {
  box-shadow: 0 0 32px rgba(16, 185, 129, 0.55), 0 6px 18px rgba(0, 0, 0, 0.3);
}

/* Pending: muted indigo, no aggressive glow */
.course-start-btn--pending {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.75) 0%, rgba(139, 92, 246, 0.75) 100%);
  color: #fff;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.2);
}

.course-start-btn--pending:hover {
  box-shadow: 0 4px 18px rgba(99, 102, 241, 0.35);
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.35), 0 4px 12px rgba(0, 0, 0, 0.25); }
  50%       { box-shadow: 0 0 36px rgba(16, 185, 129, 0.6),  0 4px 16px rgba(0, 0, 0, 0.3);  }
}
</style>
