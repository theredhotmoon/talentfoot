<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '../composables/useToast';
import ConfirmModal from './ConfirmModal.vue';
import api from '../api';

const props = defineProps<{
    tag?: { id: string; name: { en: string; pl?: string; es?: string }; clips?: any[] } | null;
    isCreate?: boolean;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'saved'): void;
    (e: 'deleted'): void;
}>();

const { t } = useI18n();
const { showToast } = useToast();

const editForm = ref({
    name: { en: '', pl: '', es: '' }
});

const showDeleteConfirm = ref(false);

const initForm = () => {
    if (props.tag && !props.isCreate) {
        editForm.value = {
            name: {
                en: props.tag.name?.en || '',
                pl: props.tag.name?.pl || '',
                es: props.tag.name?.es || '',
            }
        };
    } else {
        editForm.value = { name: { en: '', pl: '', es: '' } };
    }
};

watch(() => props.tag, initForm, { immediate: true });

const saving = ref(false);

const save = async () => {
    const payload = {
        name: { ...editForm.value.name }
    };
    saving.value = true;
    try {
        if (props.isCreate) {
            await api.post('/api/tags', payload);
        } else if (props.tag) {
            await api.put(`/api/tags/${props.tag.id}`, payload);
        }
        emit('saved');
        emit('close');
    } catch (e: any) {
        showToast({ title: 'Error', message: e.response?.data?.message || 'Failed to save', type: 'error' });
    } finally {
        saving.value = false;
    }
};

const deleteTag = async () => {
    if (!props.tag) return;
    showDeleteConfirm.value = false;
    saving.value = true;
    try {
        await api.delete(`/api/tags/${props.tag.id}`);
        emit('deleted');
        emit('close');
    } catch (e: any) {
        console.error(e);
        showToast({ title: 'Error', message: t('tags.delete_error'), type: 'error' });
    } finally {
        saving.value = false;
    }
};
</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(15, 14, 23, 0.85); backdrop-filter: blur(8px); animation: fadeIn 0.2s ease-out;">
        <div class="relative w-full max-w-lg" style="animation: modalSlideIn 0.3s ease-out;">
            <div class="card-static overflow-hidden p-6" style="border-radius: var(--tf-radius-xl); border: 1px solid var(--tf-border);">
                <!-- Close Button -->
                <button @click="$emit('close')"
                    class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style="background: rgba(255,255,255,0.05); color: var(--tf-text-muted);">
                    ✕
                </button>

                <h2 class="text-xl font-heading font-bold mb-6" style="color: var(--tf-text);">
                    {{ isCreate ? $t('tags.create_tag') : $t('tags.edit_tag') }}
                </h2>

                <!-- Name Fields -->
                <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--tf-text-muted);">{{ $t('categories.name') || 'Name' }}</p>
                <div class="grid grid-cols-1 gap-3 mb-6">
                    <div>
                        <label class="block mb-1 text-xs" style="color: var(--tf-text-dimmed);">EN</label>
                        <input v-model="editForm.name.en" class="w-full input-modern text-sm">
                    </div>
                    <div>
                        <label class="block mb-1 text-xs" style="color: var(--tf-text-dimmed);">PL</label>
                        <input v-model="editForm.name.pl" class="w-full input-modern text-sm">
                    </div>
                    <div>
                        <label class="block mb-1 text-xs" style="color: var(--tf-text-dimmed);">ES</label>
                        <input v-model="editForm.name.es" class="w-full input-modern text-sm">
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex justify-between items-center mt-6">
                    <div class="flex-1">
                        <template v-if="!isCreate && tag">
                            <button 
                                @click="showDeleteConfirm = true" 
                                :disabled="saving || (tag.clips && tag.clips.length > 0)"
                                class="btn-ghost text-sm text-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                :title="tag.clips && tag.clips.length > 0 ? $t('tags.cannot_delete') : ''"
                            >
                                {{ $t('dashboard.delete') || 'Delete' }}
                            </button>
                            <p v-if="tag.clips && tag.clips.length > 0" class="text-xs text-gray-500 mt-1">
                                {{ $t('tags.delete_warning') }}
                            </p>
                        </template>
                    </div>
                    
                    <div class="flex justify-end gap-3 flex-1">
                        <button @click="$emit('close')" class="btn-ghost text-sm">{{ $t('common.cancel') || 'Cancel' }}</button>
                        <button @click="save" :disabled="saving" class="btn-primary text-sm">{{ $t('upload.save') || 'Save' }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Delete confirmation modal -->
    <ConfirmModal
        v-if="showDeleteConfirm"
        :title="$t('tags.edit_tag')"
        :message="$t('tags.confirm_delete')"
        :confirm-label="$t('dashboard.delete') || 'Delete'"
        :cancel-label="$t('common.cancel') || 'Cancel'"
        :danger="true"
        @confirm="deleteTag"
        @cancel="showDeleteConfirm = false"
    />
</template>

<style scoped>
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes modalSlideIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
