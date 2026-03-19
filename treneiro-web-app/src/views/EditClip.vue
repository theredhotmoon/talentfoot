<template>
  <div class="">
    <h1 class="text-3xl font-heading font-bold mb-6 gradient-text">{{ $t('edit_clip.title') }}</h1>
    <div v-if="loading" class="text-white">{{ $t('edit_clip.loading') }}</div>
    <form v-else @submit.prevent="handleUpdate" class="card-static p-6 max-w-2xl mx-auto space-y-4 text-white">
      
      <!-- Language Tabs -->
      <LanguageTabs v-model="activeLang" />

      <div>
        <label class="block mb-1">{{ $t('edit_clip.name') }} ({{ activeLang.toUpperCase() }})</label>
        <input v-model="form.name[activeLang]" type="text" class="input-modern w-full" required />
      </div>
      <div>
        <label class="block mb-1">{{ $t('edit_clip.slug') }} ({{ activeLang.toUpperCase() }})</label>
        <input 
          v-model="form.slug[activeLang]"
          type="text"
          class="input-modern w-full"
        />
        <p class="text-xs" style="color: var(--tf-text-dimmed) mt-1">{{ $t('edit_clip.slug_help') }}</p>
      </div>
      <div>
        <label class="block mb-1">{{ $t('edit_clip.description') }} ({{ activeLang.toUpperCase() }})</label>
        <textarea v-model="form.description[activeLang]" class="input-modern w-full" required></textarea>
      </div>

      <!-- Main Clip Captions Upload -->
      <div class="p-4 rounded-xl" style="background: rgba(255,255,255,0.04); border: 1px solid var(--tf-border)">
        <label class="block mb-2 font-semibold">{{ $t('upload.captions') }} ({{ activeLang.toUpperCase() }})</label>
        <div v-if="existingCaptions[activeLang]" class="mb-2 text-sm " style="color: var(--tf-accent-emerald)"">
          ✓ {{ $t('edit_clip.has_captions') }}
        </div>
        <input 
          type="file" 
          @change="handleMainCaptionsChange($event, activeLang)" 
          accept=".vtt" 
          class="input-modern w-full text-sm" 
        />
        <p class="text-xs" style="color: var(--tf-text-dimmed) mt-1">{{ $t('upload.captions_help') }}</p>
      </div>

      <div>
        <label class="block mb-1">{{ $t('edit_clip.difficulty') }}</label>
        <input v-model.number="difficulty" type="number" min="1" max="10" class="input-modern w-full" required />
      </div>

      <div>
          <label class="block mb-1">{{ $t('edit_clip.category') }}</label>
          <select v-model="form.category_id" class="select-modern w-full">
              <option value="">{{ $t('edit_clip.select_category') }}</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ getTranslated(category.name) }}
              </option>
          </select>
      </div>
      <div>
        <label class="block mb-1">{{ $t('edit_clip.tags') }}</label>
        <div class="flex flex-wrap gap-2">
            <button 
                type="button"
                v-for="tag in availableTags" 
                :key="tag.id"
                @click="toggleTag(tag.id)"
                :class="['px-3 py-1 rounded text-sm transition', selectedTags.includes(tag.id) ? 'btn-tag-active' : 'btn-tag-inactive']"
            >
                {{ getTranslated(tag.name) }}
            </button>
        </div>
        <p v-if="availableTags.length === 0" class="text-gray-500 text-sm italic">No tags available.</p>
      </div>
      <div class="flex gap-4">
        <button type="submit" class="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700" :disabled="saving">
            {{ saving ? $t('edit_clip.updating') : $t('edit_clip.update') }}
        </button>
        <button type="button" @click="router.back()" class="bg-gray-600 btn-ghost">
            {{ $t('edit_clip.cancel') }}
        </button>
      </div>
    </form>

    <!-- AI Cartoon Conversion Section -->
    <div v-if="!loading" class="card-static p-6 max-w-2xl mx-auto mt-6 text-white">
      <h2 class="text-xl font-heading font-bold mb-4">🎨 {{ $t('cartoon.title') }}</h2>
      <p class="text-sm" style="color: var(--tf-text-muted) mb-4">{{ $t('cartoon.description') }}</p>

      <div class="flex items-center gap-4">
        <button
          type="button"
          @click="convertToCartoon"
          :disabled="cartoonStatus === 'processing' || cartoonStatus === 'pending' || convertingCartoon"
          :class="[
            'px-6 py-2.5 rounded-lg font-bold transition flex items-center gap-2',
            (cartoonStatus === 'processing' || cartoonStatus === 'pending')
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
          ]"
        >
          <span v-if="cartoonStatus === 'processing' || cartoonStatus === 'pending'">
            ⏳ {{ $t('cartoon.processing') }}
          </span>
          <span v-else-if="cartoonStatus === 'done'">
            🔄 {{ $t('cartoon.reconvert') }}
          </span>
          <span v-else>
            🎬 {{ $t('cartoon.convert') }}
          </span>
        </button>

        <!-- Status indicator -->
        <span v-if="cartoonStatus === 'done'" class="text-sm flex items-center gap-1" style="color: var(--tf-accent-emerald);">
          ✅ {{ $t('cartoon.done') }}
        </span>
        <span v-else-if="cartoonStatus === 'failed'" class="text-sm flex items-center gap-1" style="color: #f87171;">
          ❌ {{ $t('cartoon.failed') }}
        </span>
      </div>

      <p v-if="cartoonError" class="text-xs mt-2" style="color: #f87171;">{{ cartoonError }}</p>
    </div>

    <!-- Subclips Management Section -->
    <div v-if="!loading" class="card-static p-6 max-w-2xl mx-auto mt-6 text-white">
      <h2 class="text-xl font-heading font-bold mb-4">{{ $t('subclips.title') }}</h2>

      <!-- Existing Subclips -->
      <div v-if="subclips.length > 0" class="space-y-4 mb-6">
        <div v-for="(subclip, index) in subclips" :key="subclip.id" class="bg-gray-700 p-4 rounded-lg">
          <div class="flex justify-between items-start mb-3">
            <span class="text-sm text-gray-400">#{{ index + 1 }}</span>
            <button
              type="button"
              @click="deleteSubclip(subclip.id)"
              class="text-red-400 hover:text-red-300 text-sm transition"
            >
              ✕ Delete
            </button>
          </div>

          <!-- Subclip language tabs -->
          <LanguageTabs v-model="subclip._activeLang" size="small" />

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs" style="color: var(--tf-text-dimmed) mb-1">{{ $t('subclips.name') }} ({{ (subclip._activeLang || 'en').toUpperCase() }})</label>
              <input 
                v-model="subclip._name[subclip._activeLang || 'en']" 
                type="text" 
                class="w-full p-1.5 rounded bg-gray-600 text-white text-sm"
              />
            </div>
            <div>
              <label class="block text-xs" style="color: var(--tf-text-dimmed) mb-1">{{ $t('upload.captions') }} ({{ (subclip._activeLang || 'en').toUpperCase() }})</label>
              <div v-if="subclip._existingCaptions[subclip._activeLang || 'en']" class="text-xs  mb-1" style="color: var(--tf-accent-emerald)">
                ✓ {{ $t('edit_clip.has_captions') }}
              </div>
              <input 
                type="file" 
                @change="handleSubclipCaptionsChange($event, subclip, subclip._activeLang || 'en')" 
                accept=".vtt" 
                class="w-full p-1.5 bg-gray-600 text-white text-sm"
              />
            </div>
            <div>
              <label class="block text-xs" style="color: var(--tf-text-dimmed) mb-1">{{ $t('subclips.difficulty') }}</label>
              <input 
                v-model.number="subclip._difficulty" 
                type="number" 
                min="1" 
                max="10" 
                class="w-full p-1.5 rounded bg-gray-600 text-white text-sm"
              />
            </div>
            <!-- Preview toggle -->
            <div class="flex items-center col-span-2 mt-1">
              <label class="flex items-center gap-2 cursor-pointer text-sm" style="color: var(--tf-text-muted);">
                <input type="checkbox" v-model="subclip._is_preview" class="w-4 h-4 rounded" style="accent-color: var(--tf-accent-emerald);" />
                👁 {{ $t('subclips.preview_available') }}
              </label>
            </div>
          </div>

          <button
            type="button"
            @click="updateSubclip(subclip)"
            class="mt-2 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition"
            :disabled="subclip._saving"
          >
            {{ subclip._saving ? $t('edit_clip.updating') : $t('edit_clip.update') }}
          </button>
        </div>
      </div>
      <div v-else class="text-gray-500 italic mb-4">{{ $t('subclips.no_subclips') }}</div>

      <!-- Add New Subclip Form -->
      <div v-if="subclips.length < 10" class="border-t border-gray-600 pt-4">
        <h3 class="text-lg font-semibold mb-3">{{ $t('subclips.add') }}</h3>
        
        <!-- New subclip language tabs -->
        <LanguageTabs v-model="newSubclipLang" size="small" />

        <div class="space-y-3">
          <div>
            <label class="block text-sm mb-1">{{ $t('subclips.name') }} ({{ newSubclipLang.toUpperCase() }})</label>
            <input v-model="newSubclip.name[newSubclipLang]" type="text" class="input-modern w-full" />
          </div>
          <div>
            <label class="block text-sm mb-1">{{ $t('subclips.video_file') }}</label>
            <input type="file" @change="handleSubclipFileChange" accept="video/*" class="input-modern w-full" />
          </div>
          <div>
            <label class="block text-sm mb-1">{{ $t('upload.captions') }} ({{ newSubclipLang.toUpperCase() }})</label>
            <input type="file" @change="handleNewSubclipCaptionsChange($event, newSubclipLang)" accept=".vtt" class="input-modern w-full" />
          </div>
          <div>
            <label class="block text-sm mb-1">{{ $t('subclips.difficulty') }}</label>
            <input v-model.number="newSubclip.difficulty" type="number" min="1" max="10" class="input-modern w-full" />
          </div>
          <button
            type="button"
            @click="addSubclip"
            class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-bold transition"
            :disabled="addingSubclip"
          >
            {{ addingSubclip ? $t('subclips.adding') : $t('subclips.add') }}
          </button>
        </div>
      </div>
      <div v-else class="text-yellow-400 text-sm italic mt-2">{{ $t('subclips.max_reached') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTranslation } from '../composables/useTranslation';
import { useExtractThumbnails } from '../composables/useExtractThumbnails';
import LanguageTabs from '../components/LanguageTabs.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const id = route.params.id as string;
const { getTranslated } = useTranslation();
const { extractThumbnails } = useExtractThumbnails();

const activeLang = ref('en');

const form = reactive({
    name: { en: '', pl: '', es: '' } as Record<string, string>,
    slug: { en: '', pl: '', es: '' } as Record<string, string>,
    description: { en: '', pl: '', es: '' } as Record<string, string>,
    category_id: '',
    captions: { en: null as File | null, pl: null as File | null, es: null as File | null }
});

const existingCaptions = reactive({ en: '', pl: '', es: '' } as Record<string, string>);

const difficulty = ref(5);
const selectedTags = ref<string[]>([]);
const availableTags = ref<any[]>([]);
const categories = ref<any[]>([]);
const loading = ref(true);
const saving = ref(false);

// Subclips state
const subclips = ref<any[]>([]);
const addingSubclip = ref(false);
const newSubclipLang = ref('en');

// Cartoon state
const cartoonStatus = ref<string | null>(null);
const cartoonError = ref<string | null>(null);
const convertingCartoon = ref(false);
let cartoonPollInterval: ReturnType<typeof setInterval> | null = null;
const newSubclip = reactive({
    name: { en: '', pl: '', es: '' } as Record<string, string>,
    video_file: null as File | null,
    captions: { en: null as File | null, pl: null as File | null, es: null as File | null },
    difficulty: 5,
});

const fetchTagsAndCategories = async () => {
    try {
        const [tagsRes, catsRes] = await Promise.all([
            axios.get('/api/tags'),
            axios.get('/api/categories')
        ]);
        availableTags.value = tagsRes.data;
        categories.value = catsRes.data;
    } catch (e) {
        console.error(e);
    }
};

const fetchClip = async () => {
    try {
        const response = await axios.get(`/api/clips/${id}`);
        const clip = response.data.clip;
        
        const safeGet = (field: any, lang: string) => {
            if (typeof field === 'string') return field;
            return field?.[lang] || '';
        };

        ['en', 'pl', 'es'].forEach(lang => {
             form.name[lang] = safeGet(clip.name, lang);
             form.slug[lang] = safeGet(clip.slug, lang);
             form.description[lang] = safeGet(clip.description, lang);
             existingCaptions[lang] = safeGet(clip.captions, lang);
        });
        
        difficulty.value = clip.difficulty;
        form.category_id = clip.category_id || '';
        
        if (clip.tags) {
            selectedTags.value = clip.tags.map((t: any) => t.id);
        }

        // Load subclips with editable state
        if (clip.subclips) {
            subclips.value = clip.subclips.map((sc: any) => ({
                ...sc,
                _name: typeof sc.name === 'string' 
                    ? { en: sc.name, pl: '', es: '' } 
                    : { en: '', pl: '', es: '', ...sc.name },
                _difficulty: sc.difficulty,
                _is_preview: !!sc.is_preview,
                _existingCaptions: sc.captions || {},
                _newCaptions: { en: null, pl: null, es: null },
                _activeLang: 'en',
                _saving: false,
            }));
        }

        // Load cartoon status
        cartoonStatus.value = clip.cartoon_status || null;
    } catch (e) {
        console.error(e);
        alert(t('edit_clip.load_error'));
        router.push('/');
    } finally {
        loading.value = false;
    }
};

const toggleTag = (id: string) => {
    if (selectedTags.value.includes(id)) {
        selectedTags.value = selectedTags.value.filter(t => t !== id);
    } else {
        selectedTags.value.push(id);
    }
};

const handleMainCaptionsChange = (event: Event, lang: string) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        form.captions[lang as 'en' | 'pl' | 'es'] = target.files[0];
    }
};

const convertToCartoon = async () => {
    convertingCartoon.value = true;
    try {
        const response = await axios.post(`/api/clips/${id}/convert-cartoon`);
        cartoonStatus.value = response.data.cartoon_status;
        startCartoonPolling();
    } catch (e: any) {
        console.error(e);
        cartoonError.value = e.response?.data?.message || 'Failed to start conversion';
    } finally {
        convertingCartoon.value = false;
    }
};

const startCartoonPolling = () => {
    if (cartoonPollInterval) clearInterval(cartoonPollInterval);
    cartoonPollInterval = setInterval(async () => {
        try {
            const res = await axios.get(`/api/clips/${id}/cartoon-status`);
            cartoonStatus.value = res.data.cartoon_status;
            cartoonError.value = res.data.cartoon_error;
            if (res.data.cartoon_status === 'done' || res.data.cartoon_status === 'failed') {
                if (cartoonPollInterval) clearInterval(cartoonPollInterval);
                cartoonPollInterval = null;
            }
        } catch (e) {
            console.error('Polling error', e);
        }
    }, 5000);
};

onUnmounted(() => {
    if (cartoonPollInterval) clearInterval(cartoonPollInterval);
});

const handleUpdate = async () => {
    saving.value = true;
    
    try {
        const formData = new FormData();
        formData.append('_method', 'PUT'); // Fake PUT for file upload
        formData.append('name', JSON.stringify(form.name));
        formData.append('slug', JSON.stringify(form.slug));
        formData.append('description', JSON.stringify(form.description));
        formData.append('difficulty', difficulty.value.toString());
        if (form.category_id) formData.append('category_id', form.category_id);
        formData.append('tags', JSON.stringify(selectedTags.value));

        ['en', 'pl', 'es'].forEach((lang) => {
            const file = form.captions[lang as 'en' | 'pl' | 'es'];
            if (file) {
                formData.append(`captions_${lang}`, file);
            }
        });

        const response = await axios.post(`/api/clips/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        alert(t('edit_clip.success'));
        const slug = response.data.slug.en || response.data.slug.pl || response.data.id;
        router.push(`/clips/${response.data.id}/${slug}`);
    } catch (e) {
        console.error(e);
        alert(t('edit_clip.error'));
    } finally {
        saving.value = false;
    }
};

// Subclip management
const handleSubclipFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        newSubclip.video_file = target.files[0];
    }
};

const handleNewSubclipCaptionsChange = (event: Event, lang: string) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        newSubclip.captions[lang as 'en' | 'pl' | 'es'] = target.files[0];
    }
};

const handleSubclipCaptionsChange = (event: Event, subclip: any, lang: string) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        subclip._newCaptions[lang] = target.files[0];
    }
};

const addSubclip = async () => {
    if (!newSubclip.video_file) {
        alert(t('subclips.upload_error'));
        return;
    }
    if (!newSubclip.name.en) {
        alert('Please fill in at least English name.');
        return;
    }

    addingSubclip.value = true;
    try {
        const formData = new FormData();
        formData.append('name', JSON.stringify(newSubclip.name));
        formData.append('video_file', newSubclip.video_file);
        formData.append('difficulty', newSubclip.difficulty.toString());

        ['en', 'pl', 'es'].forEach((lang) => {
            const file = newSubclip.captions[lang as 'en' | 'pl' | 'es'];
            if (file) {
                formData.append(`captions_${lang}`, file);
            }
        });

        // Generate thumbnails
        const thumbnails = await extractThumbnails(newSubclip.video_file);
        thumbnails.forEach((blob, index) => {
            formData.append('thumbnails[]', blob, `thumb_${index}.jpg`);
        });

        const response = await axios.post(`/api/clips/${id}/subclips`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Add to local list
        subclips.value.push({
            ...response.data,
            _name: typeof response.data.name === 'string' 
                ? { en: response.data.name, pl: '', es: '' } 
                : { en: '', pl: '', es: '', ...response.data.name },
            _difficulty: response.data.difficulty,
            _existingCaptions: response.data.captions || {},
            _newCaptions: { en: null, pl: null, es: null },
            _activeLang: 'en',
            _saving: false,
        });

        // Reset form
        newSubclip.name = { en: '', pl: '', es: '' };
        newSubclip.video_file = null;
        newSubclip.captions = { en: null, pl: null, es: null };
        newSubclip.difficulty = 5;
        
        alert(t('subclips.upload_success'));
    } catch (e) {
        console.error(e);
        alert(t('subclips.upload_error'));
    } finally {
        addingSubclip.value = false;
    }
};

const updateSubclip = async (subclip: any) => {
    subclip._saving = true;
    try {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', JSON.stringify(subclip._name));
        formData.append('difficulty', subclip._difficulty.toString());
        formData.append('is_preview', subclip._is_preview ? '1' : '0');

        ['en', 'pl', 'es'].forEach((lang) => {
            const file = subclip._newCaptions[lang];
            if (file) {
                formData.append(`captions_${lang}`, file);
            }
        });

        await axios.post(`/api/subclips/${subclip.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert(t('subclips.update_success'));
    } catch (e) {
        console.error(e);
        alert(t('edit_clip.error'));
    } finally {
        subclip._saving = false;
    }
};

const deleteSubclip = async (subclipId: string) => {
    if (!confirm(t('subclips.delete_confirm'))) return;
    
    try {
        await axios.delete(`/api/subclips/${subclipId}`);
        subclips.value = subclips.value.filter(s => s.id !== subclipId);
        alert(t('subclips.delete_success'));
    } catch (e) {
        console.error(e);
        alert(t('edit_clip.error'));
    }
};

onMounted(() => {
    fetchTagsAndCategories();
    fetchClip();
});
</script>
