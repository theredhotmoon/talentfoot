<template>
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-heading font-bold mb-6 gradient-text text-center lg:text-left">{{ $t('edit_clip.title') }}</h1>
    
    <div v-if="loading" class="text-white text-center py-10">{{ $t('edit_clip.loading') }}</div>
    
    <div v-else class="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start pb-12">
      <!-- Left Column: Main Clip Details & AI Cartoon -->
      <div class="space-y-6">
        <form @submit.prevent="handleUpdate" class="card-static p-6 space-y-4 text-white">
          <h2 class="text-xl font-heading font-bold mb-2 flex items-center gap-2">🎬 {{ $t('edit_clip.main_details') || 'Main Details' }}</h2>
          
          <!-- Main Clip Preview -->
          <div v-if="mainFilePath" class="mb-4">
            <label class="block mb-2 text-sm font-semibold opacity-75">🎞️ {{ $t('edit_clip.preview') || 'Clip Preview' }}</label>
            <div class="rounded-xl overflow-hidden border border-white/10 aspect-video bg-black shadow-2xl">
              <video 
                :src="getVideoUrl(mainFilePath)" 
                controls 
                class="w-full h-full object-contain"
                preload="metadata"
              ></video>
            </div>
          </div>

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
            <textarea v-model="form.description[activeLang]" class="input-modern w-full" rows="4" required></textarea>
          </div>

          <!-- Main Clip Captions Upload -->
          <div class="p-4 rounded-xl" style="background: rgba(255,255,255,0.04); border: 1px solid var(--tf-border)">
            <label class="block mb-2 font-semibold text-sm">{{ $t('upload.captions') }} ({{ activeLang.toUpperCase() }})</label>
            <div v-if="existingCaptions[activeLang]" class="mb-2 text-sm " style="color: var(--tf-accent-emerald)">
              ✓ {{ $t('edit_clip.has_captions') }}
            </div>
            <input 
              type="file" 
              @change="handleMainCaptionsChange($event, activeLang)" 
              accept=".vtt" 
              class="input-modern w-full text-xs" 
            />
            <p class="text-xs" style="color: var(--tf-text-dimmed) mt-1">{{ $t('upload.captions_help') }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block mb-1">{{ $t('edit_clip.difficulty') }}</label>
              <input v-model.number="difficulty" type="number" min="1" max="10" class="input-modern w-full" required />
            </div>
            <div>
                <label class="block mb-1">{{ $t('edit_clip.category') }}</label>
                <select v-model="form.category_id" :aria-label="$t('edit_clip.category') || 'Category'" class="select-modern w-full">
                    <option value="">{{ $t('edit_clip.select_category') }}</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ getTranslated(category.name) }}
                    </option>
                </select>
            </div>
          </div>

          <div>
            <label class="block mb-1">{{ $t('edit_clip.tags') }}</label>
            <div class="flex flex-wrap gap-1.5">
                <button 
                    type="button"
                    v-for="tag in availableTags" 
                    :key="tag.id"
                    @click="toggleTag(tag.id)"
                    :class="['px-2.5 py-1 rounded-md text-xs transition', selectedTags.includes(tag.id) ? 'btn-tag-active' : 'btn-tag-inactive']"
                >
                    {{ getTranslated(tag.name) }}
                </button>
            </div>
          </div>
          <div class="flex gap-4 pt-2">
            <button type="submit" class="bg-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition" :disabled="saving">
                {{ saving ? $t('edit_clip.updating') : $t('edit_clip.update') }}
            </button>
            <button type="button" @click="router.back()" class="bg-gray-600 px-6 py-2 rounded-lg font-bold btn-ghost transition">
                {{ $t('edit_clip.cancel') }}
            </button>
          </div>
        </form>

        <!-- AI Cartoon Conversion Section -->
        <div class="card-static p-6 text-white">
          <h2 class="text-xl font-heading font-bold mb-4">🎨 {{ $t('cartoon.title') }}</h2>
          <p class="text-sm" style="color: var(--tf-text-muted) mb-6">{{ $t('cartoon.description') }}</p>

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

            <span v-if="cartoonStatus === 'done'" class="text-sm flex items-center gap-1" style="color: var(--tf-accent-emerald);">
              ✅ {{ $t('cartoon.done') }}
            </span>
            <span v-else-if="cartoonStatus === 'failed'" class="text-sm flex items-center gap-1" style="color: #f87171;">
              ❌ {{ $t('cartoon.failed') }}
            </span>
          </div>

          <p v-if="cartoonError" class="text-xs mt-2" style="color: #f87171;">{{ cartoonError }}</p>
        </div>
      </div>

      <!-- Right Column: Subclips Management -->
      <div class="space-y-6">
        <div class="card-static p-6 text-white">
          <h2 class="text-xl font-heading font-bold mb-6 flex items-center gap-2">📑 {{ $t('subclips.title') }}</h2>

          <!-- Existing Subclips -->
          <div v-if="subclips.length > 0" class="space-y-6 mb-6">
            <div v-for="(subclip, index) in subclips" :key="subclip.id" class="bg-white/5 border border-white/5 p-4 rounded-xl">
              <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold opacity-50">#{{ index + 1 }}</span>
                  <div class="flex gap-1">
                    <button @click="moveSubclipUp(index)" :disabled="index === 0" class="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    </button>
                    <button @click="moveSubclipDown(index)" :disabled="index === subclips.length - 1" class="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                  </div>
                </div>
                <button @click="deleteSubclip(subclip.id)" class="text-red-400 hover:text-red-300 text-sm transition">
                  ✕ {{ $t('subclips.delete') || 'Delete' }}
                </button>
              </div>

              <!-- Subclip Preview -->
              <div class="mb-4 rounded-lg overflow-hidden border border-white/10 aspect-video bg-black shadow-lg">
                <video :src="getVideoUrl(subclip.file_path)" controls class="w-full h-full object-contain" preload="metadata"></video>
              </div>

              <LanguageTabs v-model="subclip._activeLang" size="small" class="mb-3" />

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold opacity-60 mb-1">{{ $t('subclips.name') }}</label>
                  <input v-model="subclip._name[subclip._activeLang || 'en']" type="text" class="input-modern w-full text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold opacity-60 mb-1">{{ $t('subclips.difficulty') }}</label>
                  <input v-model.number="subclip._difficulty" type="number" min="1" max="10" class="input-modern w-full text-sm" />
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-semibold opacity-60 mb-1">{{ $t('upload.captions') }}</label>
                  <div v-if="subclip._existingCaptions[subclip._activeLang || 'en']" class="text-xs text-emerald-400 mb-1 shrink-0">
                    ✓ {{ $t('edit_clip.has_captions') }}
                  </div>
                  <input type="file" @change="handleSubclipCaptionsChange($event, subclip, subclip._activeLang || 'en')" accept=".vtt" class="input-modern w-full text-xs" />
                </div>
                <div class="flex items-center col-span-2 pt-1">
                  <label class="flex items-center gap-2 cursor-pointer text-xs" style="color: var(--tf-text-muted);">
                    <input type="checkbox" v-model="subclip._is_preview" class="w-4 h-4 rounded" style="accent-color: var(--tf-accent-emerald);" />
                    👁 {{ $t('subclips.preview_available') }}
                  </label>
                </div>
              </div>

              <button @click="updateSubclip(subclip)" class="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg font-bold text-sm transition" :disabled="subclip._saving">
                {{ subclip._saving ? $t('edit_clip.updating') : $t('edit_clip.update') }}
              </button>
            </div>
          </div>
          <div v-else class="text-gray-500 italic mb-6 text-center">{{ $t('subclips.no_subclips') }}</div>

          <!-- Save Order Button -->
          <div v-if="orderChanged" class="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-4">
            <span class="text-xs text-blue-200">Subclips order has been changed.</span>
            <button @click="saveOrder" :disabled="savingOrder" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold text-xs transition whitespace-nowrap">
              {{ savingOrder ? 'Saving...' : 'Save New Order' }}
            </button>
          </div>

          <!-- Add New Subclip Form -->
          <div v-if="subclips.length < 10" class="border-t border-white/10 pt-6">
            <h3 class="text-lg font-semibold mb-4 text-emerald-400">{{ $t('subclips.add') }}</h3>
            
            <LanguageTabs v-model="newSubclipLang" size="small" class="mb-4" />

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold opacity-60 mb-1">{{ $t('subclips.name') }}</label>
                <input v-model="newSubclip.name[newSubclipLang]" type="text" class="input-modern w-full" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold opacity-60 mb-1">{{ $t('subclips.video_file') }}</label>
                  <input type="file" @change="handleSubclipFileChange" accept="video/*" class="input-modern w-full text-xs" />
                </div>
                <div>
                  <label class="block text-xs font-semibold opacity-60 mb-1">{{ $t('subclips.difficulty') }}</label>
                  <input v-model.number="newSubclip.difficulty" type="number" min="1" max="10" class="input-modern w-full px-2 py-1.5" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold opacity-60 mb-1">{{ $t('upload.captions') }}</label>
                <input type="file" @change="handleNewSubclipCaptionsChange($event, newSubclipLang)" accept=".vtt" class="input-modern w-full text-xs" />
              </div>
              <button @click="addSubclip" class="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl text-white font-bold transition shadow-lg shadow-blue-600/20" :disabled="addingSubclip">
                {{ addingSubclip ? $t('subclips.adding') : $t('subclips.add') }}
              </button>
            </div>
          </div>
          <div v-else class="text-yellow-400 text-sm italic mt-2 text-center">{{ $t('subclips.max_reached') }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Subclip Confirmation Modal -->
  <ConfirmModal
    v-if="showDeleteSubclipConfirm"
    :title="$t('subclips.delete') || 'Delete Subclip'"
    :message="$t('subclips.delete_confirm')"
    :confirm-label="$t('dashboard.delete') || 'Delete'"
    :cancel-label="$t('edit_clip.cancel')"
    :danger="true"
    @confirm="confirmDeleteSubclip"
    @cancel="showDeleteSubclipConfirm = false; subclipToDelete = null"
  />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useIntervalFn } from '@vueuse/core';
import api from '../api';
import { useTranslation } from '../composables/useTranslation';
import { useExtractThumbnails } from '../composables/useExtractThumbnails';
import { useMediaUrl } from '../composables/useMediaUrl';
import { useToast } from '../composables/useToast';
import LanguageTabs from '../components/LanguageTabs.vue';
import ConfirmModal from '../components/ConfirmModal.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const id = route.params.id as string;
const { getTranslated } = useTranslation();
const { extractThumbnails } = useExtractThumbnails();
const { getVideoUrl } = useMediaUrl();
const { showToast } = useToast();

const activeLang = ref('en');
const mainFilePath = ref('');

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

const orderChanged = ref(false);
const savingOrder = ref(false);
const showDeleteSubclipConfirm = ref(false);
const subclipToDelete = ref<string | null>(null);

// VueUse useIntervalFn replaces manual setInterval/clearInterval and auto-stops on unmount.
const { pause: pauseCartoonPoll, resume: resumeCartoonPoll } = useIntervalFn(async () => {
    try {
        const res = await api.get<{ cartoon_status: string | null; cartoon_error: string | null }>(
            `/api/clips/${id}/cartoon-status`,
        );
        cartoonStatus.value = res.data.cartoon_status;
        cartoonError.value = res.data.cartoon_error;
        if (res.data.cartoon_status === 'done' || res.data.cartoon_status === 'failed') {
            pauseCartoonPoll();
        }
    } catch (e) {
        console.error('Polling error', e);
    }
}, 5000, { immediate: false });
const newSubclip = reactive({
    name: { en: '', pl: '', es: '' } as Record<string, string>,
    video_file: null as File | null,
    captions: { en: null as File | null, pl: null as File | null, es: null as File | null },
    difficulty: 5,
});

const fetchTagsAndCategories = async () => {
    try {
        const [tagsRes, catsRes] = await Promise.all([
            api.get('/api/tags'),
            api.get('/api/categories')
        ]);
        availableTags.value = tagsRes.data;
        categories.value = catsRes.data;
    } catch (e) {
        console.error(e);
    }
};

const fetchClip = async () => {
    try {
        const response = await api.get(`/api/clips/${id}`);
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
        
        mainFilePath.value = clip.file_path;
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
        showToast({ title: 'Error', message: t('edit_clip.load_error'), type: 'error' });
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
        const response = await api.post<{ cartoon_status: string }>(
            `/api/clips/${id}/convert-cartoon`,
        );
        cartoonStatus.value = response.data.cartoon_status;
        resumeCartoonPoll();
    } catch (e: unknown) {
        console.error(e);
        const err = e as { response?: { data?: { message?: string } } };
        cartoonError.value = err.response?.data?.message ?? 'Failed to start conversion';
    } finally {
        convertingCartoon.value = false;
    }
};

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

        const response = await api.post<{ slug: Record<string, string>; id: string }>(
            `/api/clips/${id}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        
        showToast({ title: 'Success', message: t('edit_clip.success'), type: 'success', icon: '✅' });
        const slug = response.data.slug.en || response.data.slug.pl || response.data.id;
        router.push(`/courses/${response.data.id}/${slug}`);
    } catch (e) {
        console.error(e);
        showToast({ title: 'Error', message: t('edit_clip.error'), type: 'error' });
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
        showToast({ title: 'Validation Error', message: t('subclips.upload_error'), type: 'error' });
        return;
    }
    if (!newSubclip.name.en) {
        showToast({ title: 'Validation Error', message: 'Please fill in at least English name.', type: 'error' });
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

        const response = await api.post(`/api/clips/${id}/subclips`, formData, {
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
        
        showToast({ title: 'Success', message: t('subclips.upload_success'), type: 'success', icon: '✅' });
    } catch (e) {
        console.error(e);
        showToast({ title: 'Error', message: t('subclips.upload_error'), type: 'error' });
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

        await api.post(`/api/subclips/${subclip.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast({ title: 'Success', message: t('subclips.update_success'), type: 'success', icon: '✅' });
    } catch (e) {
        console.error(e);
        showToast({ title: 'Error', message: t('edit_clip.error'), type: 'error' });
    } finally {
        subclip._saving = false;
    }
};

const deleteSubclip = async (subclipId: string) => {
    subclipToDelete.value = subclipId;
    showDeleteSubclipConfirm.value = true;
};

const confirmDeleteSubclip = async () => {
    const subclipId = subclipToDelete.value;
    if (!subclipId) return;
    showDeleteSubclipConfirm.value = false;
    subclipToDelete.value = null;
    try {
        await api.delete(`/api/subclips/${subclipId}`);
        subclips.value = subclips.value.filter(s => s.id !== subclipId);
        showToast({ title: 'Success', message: t('subclips.delete_success'), type: 'success', icon: '✅' });
    } catch (e) {
        console.error(e);
        showToast({ title: 'Error', message: t('edit_clip.error'), type: 'error' });
    }
};

const moveSubclipUp = (index: number) => {
    if (index === 0) return;
    const temp = subclips.value[index];
    subclips.value[index] = subclips.value[index - 1];
    subclips.value[index - 1] = temp;
    orderChanged.value = true;
};

const moveSubclipDown = (index: number) => {
    if (index === subclips.value.length - 1) return;
    const temp = subclips.value[index];
    subclips.value[index] = subclips.value[index + 1];
    subclips.value[index + 1] = temp;
    orderChanged.value = true;
};

const saveOrder = async () => {
    savingOrder.value = true;
    try {
        const ids = subclips.value.map(s => s.id);
        await api.post(`/api/clips/${id}/subclips/reorder`, { ids });
        orderChanged.value = false;
        showToast({ title: 'Success', message: 'Order updated successfully', type: 'success', icon: '✅' });
    } catch (e) {
        console.error(e);
        showToast({ title: 'Error', message: 'Failed to save order', type: 'error' });
    } finally {
        savingOrder.value = false;
    }
};

onMounted(() => {
    fetchTagsAndCategories();
    fetchClip();
});
</script>
