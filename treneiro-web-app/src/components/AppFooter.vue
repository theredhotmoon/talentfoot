<template>
  <footer class="mt-16 pt-10 pb-8 px-6" style="border-top: 1px solid var(--tf-border); background: rgba(0,0,0,0.2);">
    <div class="max-w-7xl mx-auto">
      <!-- Stats bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-10">
        <div v-for="stat in statItems" :key="stat.key" class="text-center p-3 rounded-xl" style="background: rgba(255,255,255,0.03);">
          <div class="text-2xl mb-1">{{ stat.icon }}</div>
          <template v-if="stats">
            <div class="font-heading font-bold text-lg" style="color: var(--tf-text);">{{ stats[stat.key] ?? 0 }}</div>
          </template>
          <template v-else>
            <div class="h-6 w-10 mx-auto rounded animate-pulse mb-0.5" style="background: rgba(255,255,255,0.06);"></div>
          </template>
          <div class="text-[10px] uppercase tracking-wider" style="color: var(--tf-text-dimmed);">{{ $t(stat.label) }}</div>
        </div>
      </div>

      <!-- Links & Branding -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-6">
        <!-- Logo & copy -->
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚽</span>
          <div>
            <span class="font-heading font-extrabold text-lg gradient-text">TalentFoot</span>
            <p class="text-xs" style="color: var(--tf-text-dimmed);">© {{ currentYear }} TalentFoot. All rights reserved.</p>
          </div>
        </div>

        <!-- Legal & contact links -->
        <div class="flex items-center gap-6 text-sm" style="color: var(--tf-text-muted);">
          <router-link to="/terms" class="hover:opacity-80 transition-opacity" style="color: var(--tf-text-muted);">
            {{ $t('footer.terms') }}
          </router-link>
          <router-link to="/privacy" class="hover:opacity-80 transition-opacity" style="color: var(--tf-text-muted);">
            {{ $t('footer.privacy') }}
          </router-link>
          <router-link to="/contact" class="hover:opacity-80 transition-opacity" style="color: var(--tf-accent-emerald);">
            📧 {{ $t('footer.contact') }}
          </router-link>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api';

const stats = ref<Record<string, number> | null>(null);
const currentYear = new Date().getFullYear();

const statItems = [
  { key: 'users_count', icon: '👤', label: 'footer.stat_users' },
  { key: 'active_subscriptions', icon: '💎', label: 'footer.stat_subs' },
  { key: 'clips_count', icon: '🎬', label: 'footer.stat_clips' },
  { key: 'clips_with_subclips', icon: '📚', label: 'footer.stat_courses' },
  { key: 'challenges_started', icon: '⚡', label: 'footer.stat_started' },
  { key: 'challenges_completed', icon: '🏆', label: 'footer.stat_completed' },
  { key: 'users_with_challenges', icon: '🎯', label: 'footer.stat_participants' },
];

onMounted(async () => {
  try {
    const res = await api.get('/api/stats');
    stats.value = res.data;
  } catch (e) {
    // silently ignore — footer stats are non-critical
  }
});
</script>
