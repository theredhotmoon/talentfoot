<script setup lang="ts">
import type { Comment } from '../types';

defineProps<{
  comments: Comment[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', content: string): void;
}>();

import { ref } from 'vue';
const newComment = ref('');

const handleSubmit = () => {
  if (!newComment.value.trim()) return;
  emit('submit', newComment.value);
  newComment.value = '';
};
</script>

<template>
  <div class="card-static p-6 mt-6" style="border-radius: var(--tf-radius-xl);">
    <h2 class="text-2xl font-heading font-bold mb-4" style="color: var(--tf-text);">{{ $t('clip_detail.comments_title') }}</h2>

    <!-- Comment Form -->
    <form @submit.prevent="handleSubmit" class="mb-8">
      <div class="mb-4">
        <label class="block text-sm mb-2" style="color: var(--tf-text-muted);">{{ $t('clip_detail.leave_comment') }}</label>
        <textarea
          v-model="newComment"
          class="input-modern"
          rows="3"
          required
        ></textarea>
      </div>
      <button type="submit" class="btn-primary text-sm" :disabled="submitting">
        {{ submitting ? $t('clip_detail.posting') : $t('clip_detail.post_comment') }}
      </button>
    </form>

    <!-- Comments List -->
    <div class="space-y-4">
      <div v-if="comments.length === 0" class="italic" style="color: var(--tf-text-dimmed);">
        {{ $t('clip_detail.no_comments') }}
      </div>
      <div v-for="comment in comments" :key="comment.id" class="p-4 rounded-xl" style="background: rgba(255,255,255,0.04); border: 1px solid var(--tf-border);">
        <div class="flex justify-between items-start mb-2">
          <span class="font-bold" style="color: var(--tf-accent-emerald);">{{ comment.user.name }}</span>
          <span class="text-xs" style="color: var(--tf-text-dimmed);">{{ new Date(comment.created_at).toLocaleString() }}</span>
        </div>
        <p style="color: var(--tf-text);">{{ comment.content }}</p>
      </div>
    </div>
  </div>
</template>
