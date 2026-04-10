<script setup lang="ts">
import { ref } from 'vue';
import api from '../api';
import { useI18n } from 'vue-i18n';

const emit = defineEmits<{ (e: 'close'): void }>();
const { t } = useI18n();

const form = ref({
    password: '',
    password_confirmation: '',
});
const saving = ref(false);
const error = ref('');
const success = ref(false);

const handleSubmit = async () => {
    error.value = '';
    success.value = false;

    // Client-side validation
    if (form.value.password.length < 8) {
        error.value = t('profile.password_min_length');
        return;
    }
    if (form.value.password !== form.value.password_confirmation) {
        error.value = t('profile.password_mismatch');
        return;
    }

    saving.value = true;
    try {
        await api.put('/api/profile/password', form.value);
        success.value = true;
        form.value = { password: '', password_confirmation: '' };
        setTimeout(() => emit('close'), 1500);
    } catch (e: any) {
        if (e.response?.data?.errors) {
            const errors = e.response.data.errors;
            error.value = Object.values(errors).flat().join(', ');
        } else {
            error.value = e.response?.data?.message || 'Failed to change password.';
        }
    } finally {
        saving.value = false;
    }
};
</script>

<template>
    <Teleport to="body">
        <div class="modal-overlay" @click.self="$emit('close')">
            <div class="modal-card animate-fade-up">
                <div class="px-6 py-4 flex justify-between items-center" style="border-bottom: 1px solid var(--tf-border);">
                    <h2 class="text-xl font-heading font-bold" style="color: var(--tf-text);">{{ $t('profile.change_password') }}</h2>
                    <button
                        type="button"
                        @click="$emit('close')"
                        class="text-xl leading-none transition-colors hover:opacity-80 focus:outline-none"
                        style="color: var(--tf-text-dimmed);"
                        aria-label="Close"
                    >&#times;</button>
                </div>

                <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm mb-1.5" style="color: var(--tf-text-muted);">{{ $t('profile.new_password') }}</label>
                        <input v-model="form.password" type="password" required minlength="8" class="input-modern" autocomplete="new-password" />
                    </div>
                    <div>
                        <label class="block text-sm mb-1.5" style="color: var(--tf-text-muted);">{{ $t('profile.confirm_password') }}</label>
                        <input v-model="form.password_confirmation" type="password" required minlength="8" class="input-modern" autocomplete="new-password" />
                    </div>

                    <div v-if="error" class="text-sm px-3 py-2 rounded-lg" style="color: #f87171; background: rgba(239,68,68,0.1);">{{ error }}</div>
                    <div v-if="success" class="text-sm px-3 py-2 rounded-lg" style="color: var(--tf-accent-emerald); background: rgba(110,231,183,0.1);">✓ {{ $t('profile.password_changed') }}</div>

                    <div class="flex justify-end gap-3 pt-2">
                        <button type="button" @click="$emit('close')" class="btn-ghost">
                            {{ $t('edit_clip.cancel') }}
                        </button>
                        <button type="submit" :disabled="saving" class="btn-primary">
                            {{ saving ? '...' : $t('profile.save') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
