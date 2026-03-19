<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
    category?: { id: string; name: { en: string; pl?: string; es?: string }; slug?: { en?: string; pl?: string; es?: string } } | null;
    isCreate?: boolean;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'saved'): void;
}>();

useI18n();

import axios from 'axios';

const editForm = ref({
    name: { en: '', pl: '', es: '' },
    slug: { en: '', pl: '', es: '' },
});

const slugManuallyEdited = reactive<Record<string, boolean>>({ en: false, pl: false, es: false });

const slugify = (text: string): string => {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const autoSlug = (locale: string) => {
    if (!slugManuallyEdited[locale]) {
        (editForm.value.slug as any)[locale] = slugify((editForm.value.name as any)[locale] || '');
    }
};

const initForm = () => {
    if (props.category && !props.isCreate) {
        editForm.value = {
            name: {
                en: props.category.name?.en || '',
                pl: props.category.name?.pl || '',
                es: props.category.name?.es || '',
            },
            slug: {
                en: props.category.slug?.en || '',
                pl: props.category.slug?.pl || '',
                es: props.category.slug?.es || '',
            },
        };
        slugManuallyEdited.en = !!(props.category.slug?.en);
        slugManuallyEdited.pl = !!(props.category.slug?.pl);
        slugManuallyEdited.es = !!(props.category.slug?.es);
    } else {
        editForm.value = { name: { en: '', pl: '', es: '' }, slug: { en: '', pl: '', es: '' } };
        slugManuallyEdited.en = false;
        slugManuallyEdited.pl = false;
        slugManuallyEdited.es = false;
    }
};

watch(() => props.category, initForm, { immediate: true });

const saving = ref(false);

const save = async () => {
    const payload = {
        name: { ...editForm.value.name },
        slug: {
            en: editForm.value.slug.en || slugify(editForm.value.name.en),
            pl: editForm.value.slug.pl || slugify(editForm.value.name.pl),
            es: editForm.value.slug.es || slugify(editForm.value.name.es),
        }
    };
    saving.value = true;
    try {
        if (props.isCreate) {
            await axios.post('/api/categories', payload);
        } else if (props.category) {
            await axios.put(`/api/categories/${props.category.id}`, payload);
        }
        emit('saved');
        emit('close');
    } catch (e: any) {
        alert(e.response?.data?.message || 'Failed to save');
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
                    {{ isCreate ? $t('categories.create_category') : $t('categories.edit_category') }}
                </h2>

                <!-- Name Fields -->
                <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--tf-text-muted);">{{ $t('categories.name') || 'Name' }}</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                    <div>
                        <label class="block mb-1 text-xs" style="color: var(--tf-text-dimmed);">EN</label>
                        <input v-model="editForm.name.en" @input="autoSlug('en')" class="w-full input-modern text-sm">
                    </div>
                    <div>
                        <label class="block mb-1 text-xs" style="color: var(--tf-text-dimmed);">PL</label>
                        <input v-model="editForm.name.pl" @input="autoSlug('pl')" class="w-full input-modern text-sm">
                    </div>
                    <div>
                        <label class="block mb-1 text-xs" style="color: var(--tf-text-dimmed);">ES</label>
                        <input v-model="editForm.name.es" @input="autoSlug('es')" class="w-full input-modern text-sm">
                    </div>
                </div>

                <!-- Slug Fields -->
                <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--tf-text-muted);">Slug</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    <div>
                        <label class="block mb-1 text-xs" style="color: var(--tf-text-dimmed);">EN</label>
                        <input v-model="editForm.slug.en" @input="slugManuallyEdited.en = true" class="w-full input-modern text-sm" placeholder="auto-generated">
                    </div>
                    <div>
                        <label class="block mb-1 text-xs" style="color: var(--tf-text-dimmed);">PL</label>
                        <input v-model="editForm.slug.pl" @input="slugManuallyEdited.pl = true" class="w-full input-modern text-sm" placeholder="auto-generated">
                    </div>
                    <div>
                        <label class="block mb-1 text-xs" style="color: var(--tf-text-dimmed);">ES</label>
                        <input v-model="editForm.slug.es" @input="slugManuallyEdited.es = true" class="w-full input-modern text-sm" placeholder="auto-generated">
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex justify-end gap-3">
                    <button @click="$emit('close')" class="btn-ghost text-sm">{{ $t('common.cancel') || 'Cancel' }}</button>
                    <button @click="save" :disabled="saving" class="btn-primary text-sm">{{ $t('upload.save') || 'Save' }}</button>
                </div>
            </div>
        </div>
    </div>
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
