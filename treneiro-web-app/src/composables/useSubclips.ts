import { ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';
import { useToast } from './useToast';
import { useExtractThumbnails } from './useExtractThumbnails';
import type { Subclip } from '../types';

export interface EditableSubclip extends Subclip {
  _name: Record<string, string>;
  _difficulty: number;
  _is_preview: boolean;
  _existingCaptions: Record<string, string>;
  _newCaptions: Record<string, File | null>;
  _activeLang: string;
  _saving: boolean;
}

interface NewSubclipForm {
  name: Record<string, string>;
  video_file: File | null;
  captions: Record<string, File | null>;
  difficulty: number;
}

function toEditableSubclip(sc: Subclip): EditableSubclip {
  return {
    ...sc,
    _name:
      typeof sc.name === 'string'
        ? { en: sc.name, pl: '', es: '' }
        : { en: '', pl: '', es: '', ...sc.name },
    _difficulty: sc.difficulty,
    _is_preview: !!sc.is_preview,
    _existingCaptions: (sc.captions as Record<string, string>) ?? {},
    _newCaptions: { en: null, pl: null, es: null },
    _activeLang: 'en',
    _saving: false,
  };
}

export function useSubclips(clipId: string) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { extractThumbnails } = useExtractThumbnails();

  const subclips = ref<EditableSubclip[]>([]);
  const addingSubclip = ref(false);
  const orderChanged = ref(false);
  const savingOrder = ref(false);
  const showDeleteSubclipConfirm = ref(false);
  const subclipToDelete = ref<string | null>(null);
  const newSubclipLang = ref('en');

  const newSubclip = reactive<NewSubclipForm>({
    name: { en: '', pl: '', es: '' },
    video_file: null,
    captions: { en: null, pl: null, es: null },
    difficulty: 5,
  });

  function loadSubclips(raw: Subclip[]) {
    subclips.value = raw.map(toEditableSubclip);
  }

  function handleSubclipFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files?.[0]) {
      newSubclip.video_file = target.files[0];
    }
  }

  function handleNewSubclipCaptionsChange(event: Event, lang: string) {
    const target = event.target as HTMLInputElement;
    if (target.files?.[0]) {
      newSubclip.captions[lang as 'en' | 'pl' | 'es'] = target.files[0];
    }
  }

  function handleSubclipCaptionsChange(event: Event, subclip: EditableSubclip, lang: string) {
    const target = event.target as HTMLInputElement;
    if (target.files?.[0]) {
      subclip._newCaptions[lang] = target.files[0];
    }
  }

  async function addSubclip() {
    if (!newSubclip.video_file) {
      showToast({ title: 'Validation Error', message: t('subclips.upload_error'), type: 'error' });
      return;
    }
    if (!newSubclip.name.en) {
      showToast({ title: 'Validation Error', message: t('subclips.name_required'), type: 'error' });
      return;
    }

    addingSubclip.value = true;
    try {
      const formData = new FormData();
      formData.append('name', JSON.stringify(newSubclip.name));
      formData.append('video_file', newSubclip.video_file);
      formData.append('difficulty', newSubclip.difficulty.toString());

      const langs = ['en', 'pl', 'es'] as const;
      langs.forEach((lang) => {
        const file = newSubclip.captions[lang];
        if (file) formData.append(`captions_${lang}`, file);
      });

      const thumbnails = await extractThumbnails(newSubclip.video_file);
      thumbnails.forEach((blob, index) => {
        formData.append('thumbnails[]', blob, `thumb_${index}.jpg`);
      });

      const response = await api.post<Subclip>(`/api/clips/${clipId}/subclips`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      subclips.value.push(toEditableSubclip(response.data));

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
  }

  async function updateSubclip(subclip: EditableSubclip) {
    subclip._saving = true;
    try {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('name', JSON.stringify(subclip._name));
      formData.append('difficulty', subclip._difficulty.toString());
      formData.append('is_preview', subclip._is_preview ? '1' : '0');

      const langs = ['en', 'pl', 'es'] as const;
      langs.forEach((lang) => {
        const file = subclip._newCaptions[lang];
        if (file) formData.append(`captions_${lang}`, file);
      });

      await api.post(`/api/subclips/${subclip.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast({ title: 'Success', message: t('subclips.update_success'), type: 'success', icon: '✅' });
    } catch (e) {
      console.error(e);
      showToast({ title: 'Error', message: t('edit_clip.error'), type: 'error' });
    } finally {
      subclip._saving = false;
    }
  }

  function deleteSubclip(subclipId: string) {
    subclipToDelete.value = subclipId;
    showDeleteSubclipConfirm.value = true;
  }

  async function confirmDeleteSubclip() {
    const subclipId = subclipToDelete.value;
    if (!subclipId) return;
    showDeleteSubclipConfirm.value = false;
    subclipToDelete.value = null;
    try {
      await api.delete(`/api/subclips/${subclipId}`);
      subclips.value = subclips.value.filter((s) => s.id !== subclipId);
      showToast({ title: 'Success', message: t('subclips.delete_success'), type: 'success', icon: '✅' });
    } catch (e) {
      console.error(e);
      showToast({ title: 'Error', message: t('edit_clip.error'), type: 'error' });
    }
  }

  function moveSubclipUp(index: number) {
    if (index === 0) return;
    [subclips.value[index], subclips.value[index - 1]] = [subclips.value[index - 1], subclips.value[index]];
    orderChanged.value = true;
  }

  function moveSubclipDown(index: number) {
    if (index === subclips.value.length - 1) return;
    [subclips.value[index], subclips.value[index + 1]] = [subclips.value[index + 1], subclips.value[index]];
    orderChanged.value = true;
  }

  async function saveOrder() {
    savingOrder.value = true;
    try {
      const ids = subclips.value.map((s) => s.id);
      await api.post(`/api/clips/${clipId}/subclips/reorder`, { ids });
      orderChanged.value = false;
      showToast({ title: 'Success', message: t('subclips.update_success'), type: 'success', icon: '✅' });
    } catch (e) {
      console.error(e);
      showToast({ title: 'Error', message: t('edit_clip.error'), type: 'error' });
    } finally {
      savingOrder.value = false;
    }
  }

  return {
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
  };
}
