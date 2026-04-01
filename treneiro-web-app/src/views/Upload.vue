<template>
  <div class="">
    <h1 class="text-3xl font-heading font-bold mb-6 gradient-text">{{ $t('upload.title') }}</h1>
    <form @submit.prevent="handleUpload" class="card-static p-6 max-w-2xl mx-auto space-y-4 text-white">
      
      <!-- Language Tabs -->
      <LanguageTabs v-model="activeLang" />

      <div>
        <label class="block mb-1">{{ $t('upload.name') }} ({{ activeLang.toUpperCase() }})</label>
        <input v-model="form.name[activeLang]" type="text" class="input-modern w-full" required />
      </div>
      <div>
        <label class="block mb-1">{{ $t('upload.slug') }} ({{ activeLang.toUpperCase() }})</label>
        <input 
          v-model="form.slug[activeLang]"
          type="text"
          class="input-modern w-full"
        />
        <p class="text-xs" style="color: var(--tf-text-dimmed) mt-1">{{ $t('upload.slug_help') }}</p>
      </div>
      <div>
        <label class="block mb-1">{{ $t('upload.description') }} ({{ activeLang.toUpperCase() }})</label>
        <textarea v-model="form.description[activeLang]" class="input-modern w-full" required></textarea>
      </div>

      <div>
        <label class="block mb-1">{{ $t('upload.captions') }} ({{ activeLang.toUpperCase() }})</label>
        <input type="file" @change="handleCaptionsChange($event, activeLang)" accept=".vtt" class="input-modern w-full" />
        <p class="text-xs" style="color: var(--tf-text-dimmed) mt-1">{{ $t('upload.captions_help') }}</p>
      </div>

      <div>
        <label class="block mb-1">{{ $t('upload.video_file') }}</label>
        <input type="file" @change="handleFileChange" accept="video/*" class="input-modern w-full" required />
      </div>
      <div>
        <label class="block mb-1">{{ $t('upload.difficulty') }}</label>
        <input v-model.number="form.difficulty" type="number" min="1" max="10" class="input-modern w-full" required />
      </div>

      <div>
        <label class="block mb-1">{{ $t('upload.tags') }}</label>
        <div class="flex flex-wrap gap-2">
            <button 
                type="button"
                v-for="tag in availableTags" 
                :key="tag.id"
                @click="toggleTag(tag.id)"
                :class="['px-3 py-1 rounded text-sm transition', form.tags.includes(tag.id) ? 'btn-tag-active' : 'btn-tag-inactive']"
            >
                {{ getTranslated(tag.name) }}
            </button>
        </div>
      </div>

        <div class="mb-6">
            <label class="block text-gray-400 mb-2">{{ $t('upload.category') }}</label>
            <select v-model="form.category_id" :aria-label="$t('upload.category') || 'Category'" class="w-full bg-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">{{ $t('upload.select_category') }}</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ getTranslated(category.name) }}
                </option>
            </select>
        </div>

        <button type="submit" :disabled="uploading" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition disabled:opacity-50">
          {{ uploading ? $t('upload.submitting') : $t('upload.submit') }}
        </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTranslation } from '../composables/useTranslation';
import { useExtractThumbnails } from '../composables/useExtractThumbnails';
import LanguageTabs from '../components/LanguageTabs.vue';

const { t } = useI18n();
const router = useRouter();
const { getTranslated } = useTranslation();
const { extractThumbnails } = useExtractThumbnails();

const activeLang = ref('en');

const form = ref({
  name: { en: '', pl: '', es: '' } as Record<string, string>,
  slug: { en: '', pl: '', es: '' } as Record<string, string>,
  description: { en: '', pl: '', es: '' } as Record<string, string>,
  captions: { en: null as File | null, pl: null as File | null, es: null as File | null },
  video_file: null as File | null,
  difficulty: 5,
  tags: [] as string[],
  category_id: ''
});

const categories = ref<any[]>([]);
const availableTags = ref<any[]>([]);

const uploading = ref(false);

const fetchData = async () => {
    try {
        const [catsRes, tagsRes] = await Promise.all([
            api.get('/api/categories'),
            api.get('/api/tags')
        ]);
        categories.value = catsRes.data;
        availableTags.value = tagsRes.data;
    } catch (e) {
        console.error(e);
    }
};

onMounted(() => {
    fetchData();
});

const toggleTag = (id: string) => {
    if (form.value.tags.includes(id)) {
        form.value.tags = form.value.tags.filter(t => t !== id);
    } else {
        form.value.tags.push(id);
    }
};

const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        form.value.video_file = target.files[0];
    }
};

const handleCaptionsChange = (event: Event, lang: string) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        form.value.captions[lang as 'en' | 'pl' | 'es'] = target.files[0];
    }
};

const handleUpload = async () => {
    if (!form.value.video_file) {
        alert(t('upload.error'));
        return;
    }

    // Basic validation: Ensure at least EN is filled
    if (!form.value.name.en || !form.value.description.en) {
        alert(t('upload.fill_english'));
        return;
    }

    uploading.value = true;
    const formData = new FormData();
    
    // We send objects as JSON strings because FormData handles strings best
    formData.append('name', JSON.stringify(form.value.name));
    formData.append('slug', JSON.stringify(form.value.slug));
    formData.append('description', JSON.stringify(form.value.description));
    
    // Append captions if they exist
    ['en', 'pl', 'es'].forEach((lang) => {
        const file = form.value.captions[lang as 'en' | 'pl' | 'es'];
        if (file) {
            formData.append(`captions_${lang}`, file);
        }
    });

    if (form.value.video_file) {
        formData.append('video_file', form.value.video_file);
    }
    formData.append('difficulty', form.value.difficulty.toString());
    
    formData.append('tags', JSON.stringify(form.value.tags));
    if (form.value.category_id) {
        formData.append('category_id', form.value.category_id);
    }
    
    // Generate thumbnails
    if (form.value.video_file) {
        const thumbnails = await extractThumbnails(form.value.video_file);
        thumbnails.forEach((blob, index) => {
            formData.append('thumbnails[]', blob, `thumb_${index}.jpg`);
        });
    }

    try {
        const response = await api.post('/api/clips', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        alert(t('upload.success'));
        // Redirect to edit page so user can add subclips
        router.push(`/courses/${response.data.id}/edit`);
    } catch (e) {
        console.error(e);
        alert(t('upload.error'));
    } finally {
        uploading.value = false;
    }
};
</script>
