<script setup lang="ts">
import { useTranslation } from '../composables/useTranslation';
import { useMediaUrl } from '../composables/useMediaUrl';
import { useThumbnailPreview } from '../composables/useThumbnailPreview';
import TagPills from './TagPills.vue';
import ClipStatsGrid from './ClipStatsGrid.vue';
import RateClipModal from './RateClipModal.vue';
import { ref } from 'vue';

const showRateModal = ref(false);

const { getTranslated } = useTranslation();
const { getVideoUrl, getThumbnailUrl } = useMediaUrl();
const { startPreview, stopPreview, updatePreview } = useThumbnailPreview();

defineProps<{
    clip: any;
    showRateSelect?: boolean;
}>();

const emit = defineEmits<{
    (e: 'rate', clipId: string, rating: number): void;
}>();

const onStatsRate = (rating: number, clipId: string) => {
    showRateModal.value = false;
    emit('rate', clipId, rating);
};
</script>

<template>
    <div class="card group">
        <div
            class="bg-black aspect-video relative cursor-pointer overflow-hidden"
            style="border-radius: var(--tf-radius-xl) var(--tf-radius-xl) 0 0;"
            @mouseenter="startPreview(clip)"
            @mouseleave="stopPreview(clip)"
            @mousemove="updatePreview($event, clip)"
        >
            <router-link :to="`/clips/${clip.id}/${getTranslated(clip.slug)}`">
                <img
                    v-if="clip.activeThumbnail"
                    :src="getThumbnailUrl(clip.activeThumbnail)"
                    class="w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover:scale-105"
                />
                <video
                    v-else
                    :src="getVideoUrl(clip.file_path)"
                    class="w-full h-full object-contain pointer-events-none"
                    :poster="getThumbnailUrl(clip.thumbnails?.[0])"
                ></video>
                <!-- Play overlay -->
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300" style="background: rgba(0,0,0,0.4);">
                    <div class="w-14 h-14 rounded-full flex items-center justify-center" style="background: var(--tf-gradient-primary);">
                        <svg class="w-6 h-6 ml-0.5" fill="#0f0e17" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                </div>
            </router-link>
        </div>
        <div class="p-5">
            <router-link :to="`/clips/${clip.id}/${getTranslated(clip.slug)}`" class="hover:opacity-80 transition-opacity">
                <h3 class="font-heading font-bold text-lg mb-1.5" style="color: var(--tf-text);">{{ getTranslated(clip.name) }}</h3>
            </router-link>

            <TagPills v-if="clip.tags" :tags="clip.tags" />

            <ClipStatsGrid
                :difficulty="clip.difficulty"
                :views="clip.views"
                :comments="clip.comments_count || 0"
                :rating="clip.average_rating ? Number(clip.average_rating).toFixed(1) : '-'"
                :ratings-count="clip.ratings_count"
                :category="clip.category || null"
                :category-label="clip.category ? getTranslated(clip.category.name) : undefined"
                :subclips-count="clip.subclips_count"
                :participants-count="clip.challenges_count"
                :completed-count="clip.completed_challenges_count"
                :show-rate-select="showRateSelect"
                @open-rate-modal="showRateModal = true"
            />

            <!-- Rate Clip Modal -->
            <RateClipModal
                v-if="showRateModal"
                :initial-rating="clip.current_user_rating ? clip.current_user_rating.rating : 0"
                @close="showRateModal = false"
                @submit="onStatsRate($event, clip.id)"
            />

            <!-- Slot for extra content like challenge progress -->
            <slot />
        </div>
    </div>
</template>
