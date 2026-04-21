<script setup lang="ts">
import { ref } from 'vue';
import api from '../api';
import { useI18n } from 'vue-i18n';
import { useToast } from '../composables/useToast';

const emit = defineEmits<{ (e: 'close'): void }>();
const { t } = useI18n();
const { showToast } = useToast();

const form = ref({
    password: '',
    password_confirmation: '',
});
const saving = ref(false);

const handleSubmit = async () => {
    // Client-side validation
    if (form.value.password.length < 8) {
        showToast({ title: 'Validation Error', message: t('profile.password_min_length'), type: 'error' });
        return;
    }
    if (form.value.password !== form.value.password_confirmation) {
        showToast({ title: 'Validation Error', message: t('profile.password_mismatch'), type: 'error' });
        return;
    }

    saving.value = true;
    try {
        await api.put('/api/profile/password', form.value);
        showToast({ title: t('profile.change_password'), message: t('profile.password_changed'), type: 'success', icon: '🔑' });
        form.value = { password: '', password_confirmation: '' };
        setTimeout(() => emit('close'), 1000);
    } catch (e: unknown) {
        const err = e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
        const message = err.response?.data?.errors
            ? Object.values(err.response.data.errors).flat().join(', ')
            : err.response?.data?.message || 'Failed to change password.';
        showToast({ title: 'Error', message, type: 'error' });
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
