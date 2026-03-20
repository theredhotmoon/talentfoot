<script setup lang="ts">
import type { ActiveChallenge } from '../types';

defineProps<{
  challenge: ActiveChallenge;
}>();
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 z-40 p-3" style="background: rgba(15,14,23,0.95); backdrop-filter: blur(12px); border-top: 1px solid var(--tf-border);">
    <div class="max-w-3xl mx-auto flex items-center gap-4">
      <span class="text-sm font-semibold" style="color: var(--tf-accent-amber);">⚡ {{ $t('challenges.active') }}</span>
      <div class="flex-1 h-2 rounded-full" style="background: rgba(255,255,255,0.08);">
        <div
          class="h-2 rounded-full transition-all duration-500"
          :style="`width: ${(challenge.watched_items / challenge.total_items) * 100}%; background: var(--tf-gradient-warm);`"
        ></div>
      </div>
      <span class="text-xs" style="color: var(--tf-text-muted);">{{ challenge.watched_items }}/{{ challenge.total_items }}</span>
    </div>
  </div>
</template>
