<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        id="app-settings-modal-overlay"
        class="modal-overlay"
        style="overscroll-behavior: contain;"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('settings.title')"
        @click.self="close"
        @keydown.esc="close"
      >
        <Transition name="modal-slide">
          <div
            v-if="modelValue"
            class="modal-card animate-fade-up"
            style="max-width: 32rem;"
            ref="panelRef"
            tabindex="-1"
          >
            <!-- Header -->
            <div class="px-6 pt-6 pb-4 flex items-start justify-between gap-4" style="border-bottom: 1px solid var(--tf-border);">
              <div>
                <h2 id="settings-modal-title" class="font-heading font-bold text-xl gradient-text-secondary">
                  {{ $t('settings.title') }}
                </h2>
                <p class="text-xs mt-0.5" style="color: var(--tf-text-muted);">
                  {{ $t('settings.subtitle') }}
                </p>
              </div>
              <button
                @click="close"
                class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-400 outline-none"
                style="color: var(--tf-text-dimmed);"
                :aria-label="$t('common.cancel')"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <line x1="2" y1="2" x2="14" y2="14" /><line x1="14" y1="2" x2="2" y2="14" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <form @submit.prevent="handleSave" class="px-6 py-5 space-y-5" novalidate>

              <!-- Setting row: Max Active Challenges -->
              <div class="setting-row">
                <label for="setting-max-challenges" class="setting-label">
                  <span class="setting-icon">🏆</span>
                  <span>{{ $t('settings.max_challenges') }}</span>
                </label>
                <div class="setting-input-wrap">
                  <input
                    id="setting-max-challenges"
                    v-model.number="form.max_active_challenges"
                    type="number"
                    name="max_active_challenges"
                    inputmode="numeric"
                    min="1"
                    max="50"
                    autocomplete="off"
                    class="input-modern setting-number-input"
                    :class="{ 'input-error': errors.max_active_challenges }"
                    :aria-describedby="errors.max_active_challenges ? 'err-max-challenges' : undefined"
                    @input="clearError('max_active_challenges')"
                  />
                  <span class="setting-range-hint">1 – 50</span>
                </div>
                <p v-if="errors.max_active_challenges" id="err-max-challenges" class="setting-error" role="alert">
                  {{ errors.max_active_challenges }}
                </p>
              </div>

              <!-- Setting row: Dashboard Clips Count -->
              <div class="setting-row">
                <label for="setting-dashboard-count" class="setting-label">
                  <span class="setting-icon">🎯</span>
                  <span>{{ $t('settings.dashboard_count') }}</span>
                </label>
                <div class="setting-input-wrap">
                  <input
                    id="setting-dashboard-count"
                    v-model.number="form.dashboard_clips_count"
                    type="number"
                    name="dashboard_clips_count"
                    inputmode="numeric"
                    min="1"
                    max="20"
                    autocomplete="off"
                    class="input-modern setting-number-input"
                    :class="{ 'input-error': errors.dashboard_clips_count }"
                    :aria-describedby="errors.dashboard_clips_count ? 'err-dashboard-count' : undefined"
                    @input="clearError('dashboard_clips_count')"
                  />
                  <span class="setting-range-hint">1 – 20</span>
                </div>
                <p v-if="errors.dashboard_clips_count" id="err-dashboard-count" class="setting-error" role="alert">
                  {{ errors.dashboard_clips_count }}
                </p>
              </div>

              <!-- Setting row: Per-page Count -->
              <div class="setting-row">
                <label for="setting-per-page" class="setting-label">
                  <span class="setting-icon">📄</span>
                  <span>{{ $t('settings.per_page') }}</span>
                </label>
                <div class="setting-input-wrap">
                  <input
                    id="setting-per-page"
                    v-model.number="form.per_page_count"
                    type="number"
                    name="per_page_count"
                    inputmode="numeric"
                    min="3"
                    max="30"
                    autocomplete="off"
                    class="input-modern setting-number-input"
                    :class="{ 'input-error': errors.per_page_count }"
                    :aria-describedby="errors.per_page_count ? 'err-per-page' : undefined"
                    @input="clearError('per_page_count')"
                  />
                  <span class="setting-range-hint">3 – 30</span>
                </div>
                <p v-if="errors.per_page_count" id="err-per-page" class="setting-error" role="alert">
                  {{ errors.per_page_count }}
                </p>
              </div>

              <!-- Live region for save feedback -->
              <div aria-live="polite" aria-atomic="true" class="sr-only">
                <span v-if="savedMessage">{{ savedMessage }}</span>
              </div>

              <!-- Inline feedback banner -->
              <Transition name="feedback-fade">
                <div
                  v-if="savedMessage"
                  class="feedback-banner"
                  :class="savedMessage === $t('settings.saved') ? 'feedback-success' : 'feedback-error'"
                >
                  {{ savedMessage }}
                </div>
              </Transition>

              <!-- Footer -->
              <div class="flex gap-3 pt-1">
                <button
                  type="button"
                  @click="close"
                  class="btn-ghost flex-1"
                >
                  {{ $t('common.cancel') }}
                </button>
                <button
                  type="submit"
                  class="btn-primary flex-1"
                  :disabled="saving"
                  id="settings-save-btn"
                >
                  <svg v-if="saving" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="30 70" />
                  </svg>
                  {{ saving ? $t('settings.saving') : $t('settings.save') }}
                </button>
              </div>

            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '../stores/settings';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const { t } = useI18n();
const settings = useSettingsStore();
const panelRef = ref<HTMLElement | null>(null);

interface FormState {
  max_active_challenges: number;
  dashboard_clips_count: number;
  per_page_count: number;
}

interface Errors {
  max_active_challenges?: string;
  dashboard_clips_count?: string;
  per_page_count?: string;
}

const form = ref<FormState>({
  max_active_challenges: settings.maxActiveChallenges,
  dashboard_clips_count: settings.dashboardClipsCount,
  per_page_count: settings.perPageCount,
});

const errors = ref<Errors>({});
const saving = ref(false);
const savedMessage = ref('');
let savedTimer: ReturnType<typeof setTimeout> | null = null;

// Sync form with store when modal opens
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = {
        max_active_challenges: settings.maxActiveChallenges,
        dashboard_clips_count: settings.dashboardClipsCount,
        per_page_count: settings.perPageCount,
      };
      errors.value = {};
      savedMessage.value = '';
      // Focus the panel so Esc works & screen-readers announce the dialog
      nextTick(() => panelRef.value?.focus());
    }
  },
);

function close() {
  emit('update:modelValue', false);
}

function clearError(key: keyof Errors) {
  delete errors.value[key];
}

function validate(): boolean {
  const e: Errors = {};
  const { max_active_challenges: mac, dashboard_clips_count: dcc, per_page_count: ppc } = form.value;

  if (!Number.isInteger(mac) || mac < 1 || mac > 50) e.max_active_challenges = t('settings.range_hint', { min: 1, max: 50 });
  if (!Number.isInteger(dcc) || dcc < 1 || dcc > 20) e.dashboard_clips_count = t('settings.range_hint', { min: 1, max: 20 });
  if (!Number.isInteger(ppc) || ppc < 3 || ppc > 30) e.per_page_count = t('settings.range_hint', { min: 3, max: 30 });

  errors.value = e;
  return Object.keys(e).length === 0;
}

async function handleSave() {
  if (!validate()) return;

  saving.value = true;
  savedMessage.value = '';

  try {
    await settings.saveSettings({ ...form.value });
    savedMessage.value = t('settings.saved');
    if (savedTimer) clearTimeout(savedTimer);
    savedTimer = setTimeout(() => {
      savedMessage.value = '';
      close();
    }, 1500);
  } catch {
    savedMessage.value = t('settings.error');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
/* Setting row layout */
.setting-row {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--tf-text);
  cursor: pointer;
}

.setting-icon {
  font-size: 1rem;
  line-height: 1;
}

.setting-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.setting-number-input {
  width: 6rem !important;
  text-align: center;
  flex-shrink: 0;
  padding: 0.5rem 0.75rem !important;
  border-radius: var(--tf-radius-md) !important;
  font-variant-numeric: tabular-nums;
}

.setting-range-hint {
  font-size: 0.75rem;
  color: var(--tf-text-dimmed);
  font-variant-numeric: tabular-nums;
}

.input-error {
  border-color: #f87171 !important;
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.15) !important;
}

.setting-error {
  font-size: 0.75rem;
  color: #f87171;
  margin: 0;
}

/* Feedback banner */
.feedback-banner {
  padding: 0.625rem 1rem;
  border-radius: var(--tf-radius-md);
  font-size: 0.8125rem;
  font-weight: 500;
  text-align: center;
}

.feedback-success {
  background: rgba(110, 231, 183, 0.12);
  color: var(--tf-accent-emerald);
  border: 1px solid rgba(110, 231, 183, 0.25);
}

.feedback-error {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.25);
}

/* Animations — opacity + transform only, respects prefers-reduced-motion */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.22s ease;
}

.modal-slide-enter-from,
.modal-slide-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}

.feedback-fade-enter-active,
.feedback-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.feedback-fade-enter-from,
.feedback-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .modal-fade-enter-active,
  .modal-fade-leave-active,
  .modal-slide-enter-active,
  .modal-slide-leave-active,
  .feedback-fade-enter-active,
  .feedback-fade-leave-active {
    transition: none;
  }
}

/* Spinner */
.animate-spin {
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border-width: 0;
}
</style>
