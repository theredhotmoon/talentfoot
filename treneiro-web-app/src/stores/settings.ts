import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api';

interface AppSettings {
  max_active_challenges: number;
  dashboard_clips_count: number;
  per_page_count: number;
}

const DEFAULTS: AppSettings = {
  max_active_challenges: 9,
  dashboard_clips_count: 6,
  per_page_count: 9,
};

export const useSettingsStore = defineStore('settings', () => {
  const maxActiveChallenges = ref(DEFAULTS.max_active_challenges);
  const dashboardClipsCount = ref(DEFAULTS.dashboard_clips_count);
  const perPageCount = ref(DEFAULTS.per_page_count);
  const loaded = ref(false);

  /** Fetch settings from the public API endpoint. Safe to call for any user. */
  async function fetchSettings(): Promise<void> {
    try {
      const res = await api.get<AppSettings>('/api/settings');
      maxActiveChallenges.value = res.data.max_active_challenges ?? DEFAULTS.max_active_challenges;
      dashboardClipsCount.value  = res.data.dashboard_clips_count  ?? DEFAULTS.dashboard_clips_count;
      perPageCount.value         = res.data.per_page_count          ?? DEFAULTS.per_page_count;
    } catch {
      // Network error — keep defaults, app still works
    } finally {
      loaded.value = true;
    }
  }

  /** Admin-only: persist updated settings to the backend. */
  async function saveSettings(data: Partial<AppSettings>): Promise<AppSettings> {
    const res = await api.put<AppSettings>('/api/admin/settings', data);
    maxActiveChallenges.value = res.data.max_active_challenges;
    dashboardClipsCount.value  = res.data.dashboard_clips_count;
    perPageCount.value         = res.data.per_page_count;
    return res.data;
  }

  return {
    maxActiveChallenges,
    dashboardClipsCount,
    perPageCount,
    loaded,
    fetchSettings,
    saveSettings,
  };
});
