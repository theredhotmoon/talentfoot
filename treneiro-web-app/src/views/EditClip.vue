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
            <p class="text-xs mt-1" style="color: var(--tf-text-dimmed)">{{ $t('edit_clip.slug_help') }}</p>
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
            <p class="text-xs mt-1" style="color: var(--tf-text-dimmed)">{{ $t('upload.captions_help') }}</p>
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
          <p class="text-sm mb-6" style="color: var(--tf-text-muted)">{{ $t('cartoon.description') }}</p>

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
import api from '../api';
import { useTranslation } from '../composables/useTranslation';
import { useMediaUrl } from '../composables/useMediaUrl';
import { useToast } from '../composables/useToast';
import { useSubclips } from '../composables/useSubclips';
import { useCartoonConversion } from '../composables/useCartoonConversion';
import LanguageTabs from '../components/LanguageTabs.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import type { Tag, Category } from '../types';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const id = route.params.id as string;
const { getTranslated } = useTranslation();
const { getVideoUrl } = useMediaUrl();
const { showToast } = useToast();

// ── Composables ────────────────────────────────────────────────────────────
const {
  subclips,
  newSubclip,
  newSubclipLang,
  addingSubclip,
  orderChanged,
  savingOrder,
  showDeleteSubclipConfirm,
  subclipToDelete,
  loadSubclips,
  handleSubclipFileChange,
  handleNewSubclipCaptionsChange,
  handleSubclipCaptionsChange,
  addSubclip,
  updateSubclip,
  deleteSubclip,
  confirmDeleteSubclip,
  moveSubclipUp,
  moveSubclipDown,
  saveOrder,
} = useSubclips(id);

const { cartoonStatus, cartoonError, convertingCartoon, convertToCartoon } =
  useCartoonConversion(id);

// ── Main clip state ────────────────────────────────────────────────────────
const activeLang = ref('en');
const mainFilePath = ref('');

const form = reactive({
  name: { en: '', pl: '', es: '' } as Record<string, string>,
  slug: { en: '', pl: '', es: '' } as Record<string, string>,
  description: { en: '', pl: '', es: '' } as Record<string, string>,
  category_id: '',
  captions: { en: null as File | null, pl: null as File | null, es: null as File | null },
});

const existingCaptions = reactive<Record<string, string>>({ en: '', pl: '', es: '' });
const difficulty = ref(5);
const selectedTags = ref<string[]>([]);
const availableTags = ref<Tag[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(true);
const saving = ref(false);

// ── Data fetching ──────────────────────────────────────────────────────────
const fetchTagsAndCategories = async () => {
  try {
    const [tagsRes, catsRes] = await Promise.all([
      api.get<Tag[]>('/api/tags'),
      api.get<Category[]>('/api/categories'),
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

    const safeGet = (field: unknown, lang: string): string => {
      if (typeof field === 'string') return field;
      return (field as Record<string, string>)?.[lang] ?? '';
    };

    ['en', 'pl', 'es'].forEach((lang) => {
      form.name[lang] = safeGet(clip.name, lang);
      form.slug[lang] = safeGet(clip.slug, lang);
      form.description[lang] = safeGet(clip.description, lang);
      existingCaptions[lang] = safeGet(clip.captions, lang);
    });

    mainFilePath.value = clip.file_path;
    difficulty.value = clip.difficulty;
    form.category_id = clip.category_id ?? '';

    if (clip.tags) {
      selectedTags.value = clip.tags.map((tag: Tag) => tag.id);
    }

    if (clip.subclips) {
      loadSubclips(clip.subclips);
    }

    cartoonStatus.value = clip.cartoon_status ?? null;
  } catch (e) {
    console.error(e);
    showToast({ title: 'Error', message: t('edit_clip.load_error'), type: 'error' });
    router.push('/');
  } finally {
    loading.value = false;
  }
};

// ── Actions ────────────────────────────────────────────────────────────────
const toggleTag = (tagId: string) => {
  if (selectedTags.value.includes(tagId)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tagId);
  } else {
    selectedTags.value.push(tagId);
  }
};

const handleMainCaptionsChange = (event: Event, lang: string) => {
  const target = event.target as HTMLInputElement;
  if (target.files?.[0]) {
    form.captions[lang as 'en' | 'pl' | 'es'] = target.files[0];
  }
};

const handleUpdate = async () => {
  saving.value = true;
  try {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('name', JSON.stringify(form.name));
    formData.append('slug', JSON.stringify(form.slug));
    formData.append('description', JSON.stringify(form.description));
    formData.append('difficulty', difficulty.value.toString());
    if (form.category_id) formData.append('category_id', form.category_id);
    formData.append('tags', JSON.stringify(selectedTags.value));

    const langs = ['en', 'pl', 'es'] as const;
    langs.forEach((lang) => {
      const file = form.captions[lang];
      if (file) formData.append(`captions_${lang}`, file);
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

onMounted(() => {
  fetchTagsAndCategories();
  fetchClip();
});
</script>
