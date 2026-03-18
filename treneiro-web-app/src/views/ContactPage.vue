<template>
  <div>
    <div class="mb-8">
      <h1 class="font-heading font-extrabold text-3xl gradient-text mb-2">{{ $t('contact.title') }}</h1>
      <p class="text-sm" style="color: var(--tf-text-muted);">{{ $t('contact.subtitle') }}</p>
    </div>

    <div class="max-w-2xl">
      <div class="card-static p-8" style="border-radius: var(--tf-radius-xl);">
        <!-- Success Message -->
        <transition name="slide-up">
          <div v-if="sent" class="mb-6 p-4 rounded-xl text-center" style="background: rgba(110,231,183,0.1); border: 1px solid rgba(110,231,183,0.3);">
            <span class="text-2xl block mb-1">✅</span>
            <p class="font-semibold" style="color: var(--tf-accent-emerald);">{{ $t('contact.success') }}</p>
          </div>
        </transition>

        <form v-if="!sent" @submit.prevent="submitForm" class="space-y-5">
          <div>
            <label class="block text-sm font-semibold mb-1.5" style="color: var(--tf-text);">{{ $t('contact.name') }}</label>
            <input v-model="form.name" type="text" required class="w-full input-modern" :placeholder="$t('contact.name_placeholder')" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1.5" style="color: var(--tf-text);">{{ $t('contact.email') }}</label>
            <input v-model="form.email" type="email" required class="w-full input-modern" :placeholder="$t('contact.email_placeholder')" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1.5" style="color: var(--tf-text);">{{ $t('contact.message') }}</label>
            <textarea v-model="form.message" required rows="5" class="w-full input-modern resize-none" :placeholder="$t('contact.message_placeholder')"></textarea>
          </div>
          <div class="flex items-center gap-3">
            <button type="submit" :disabled="submitting" class="btn-primary px-6 py-2.5">
              <span v-if="submitting">{{ $t('contact.sending') }}...</span>
              <span v-else>{{ $t('contact.send') }}</span>
            </button>
            <p v-if="error" class="text-sm" style="color: var(--tf-accent-red);">{{ error }}</p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const form = ref({ name: '', email: '', message: '' });
const submitting = ref(false);
const sent = ref(false);
const error = ref('');

const submitForm = async () => {
    submitting.value = true;
    error.value = '';
    try {
        await axios.post('http://localhost:8000/api/contact', form.value);
        sent.value = true;
    } catch (e: any) {
        if (e.response?.data?.errors) {
            error.value = Object.values(e.response.data.errors).flat().join(', ');
        } else {
            error.value = t('contact.error');
        }
    } finally {
        submitting.value = false;
    }
};
</script>
