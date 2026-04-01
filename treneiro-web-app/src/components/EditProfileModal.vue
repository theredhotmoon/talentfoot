<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../api';

const emit = defineEmits<{ (e: 'close'): void }>();
const auth = useAuthStore();

const form = ref({
    name: '',
    email: '',
});
const saving = ref(false);
const error = ref('');
const success = ref(false);

onMounted(() => {
    if (auth.user) {
        form.value.name = auth.user.name;
        form.value.email = auth.user.email;
    }
});

const handleSubmit = async () => {
    saving.value = true;
    error.value = '';
    success.value = false;

    try {
        const response = await api.put('/api/profile', form.value);
        if (auth.user) {
            auth.user.name = response.data.name;
            auth.user.email = response.data.email;
        }
        success.value = true;
        setTimeout(() => emit('close'), 1000);
    } catch (e: any) {
        if (e.response?.data?.errors) {
            const errors = e.response.data.errors;
            error.value = Object.values(errors).flat().join(', ');
        } else {
            error.value = e.response?.data?.message || 'Failed to update profile.';
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
                    <h2 class="text-xl font-heading font-bold" style="color: var(--tf-text);">{{ $t('profile.edit_details') }}</h2>
                    <button @click="$emit('close')" class="text-xl transition-colors onmouseover=" style="color: var(--tf-text-dimmed);"this.style.color='var(--tf-text)'" onmouseout="this.style.color='var(--tf-text-dimmed)'">&times;</button>
                </div>

                <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm mb-1.5" style="color: var(--tf-text-muted);">{{ $t('profile.name') }}</label>
                        <input v-model="form.name" type="text" required class="input-modern" />
                    </div>
                    <div>
                        <label class="block text-sm mb-1.5" style="color: var(--tf-text-muted);">{{ $t('profile.email') }}</label>
                        <input v-model="form.email" type="email" required class="input-modern" />
                    </div>

                    <div v-if="error" class="text-sm px-3 py-2 rounded-lg" style="color: #f87171; background: rgba(239,68,68,0.1);">{{ error }}</div>
                    <div v-if="success" class="text-sm px-3 py-2 rounded-lg" style="color: var(--tf-accent-emerald); background: rgba(110,231,183,0.1);">✓ {{ $t('profile.updated') }}</div>

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
