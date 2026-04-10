<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '../stores/auth';

const emit = defineEmits<{ (e: 'close'): void }>();
const authStore = useAuthStore();
const loading = ref(false);

const hasActiveSubscription = computed(() => {
  if (!authStore.user?.subscription_valid_until) return false;
  return new Date(authStore.user.subscription_valid_until) > new Date();
});

const handleRenew = async () => {
    loading.value = true;
    await authStore.renewSubscription();
    loading.value = false;
};

const handleCancel = async () => {
    loading.value = true;
    await authStore.cancelSubscription();
    loading.value = false;
};
</script>

<template>
    <Teleport to="body">
        <div class="modal-overlay" @click.self="$emit('close')">
            <div class="modal-card animate-fade-up text-center relative pt-8">
                <button @click="$emit('close')" class="absolute top-4 right-4 text-2xl transition-colors" style="color: var(--tf-text-dimmed); line-height: 1;" onmouseover="this.style.color='var(--tf-text)'" onmouseout="this.style.color='var(--tf-text-dimmed)'">&times;</button>
                
                <div class="px-6 mb-6">
                    <span class="text-3xl inline-block mb-3">⭐</span>
                    <h2 class="text-xl font-heading font-extrabold gradient-text">Renew Subscription</h2>
                    <p class="text-sm mt-2" style="color: var(--tf-text-muted);">
                        Note: This view is only for testing purposes. We are going to extend it later.
                    </p>
                </div>

                <div class="px-6 pb-6">
                    <div class="mb-6 p-4 rounded-xl text-left" style="background: rgba(255,255,255,0.05); border: 1px solid var(--tf-border);">
                        <p class="text-sm font-semibold mb-1" style="color: var(--tf-text-muted);">Current Status:</p>
                        <p class="text-lg">
                            <span v-if="hasActiveSubscription" class="font-bold" style="color: var(--tf-accent-emerald);">Active</span>
                            <span v-else class="text-red-400 font-bold">Inactive</span>
                        </p>
                        <p v-if="authStore.user?.subscription_valid_until" class="text-xs mt-2" style="color: var(--tf-text-dimmed);">
                            Valid until: <span class="text-white">{{ new Date(authStore.user.subscription_valid_until).toLocaleDateString() }}</span>
                        </p>
                    </div>

                    <div class="flex flex-col gap-3">
                        <button 
                            @click="handleRenew" 
                            class="btn-primary w-full text-sm py-2.5" 
                            :disabled="loading"
                        >
                            <span v-if="loading">Processing...</span>
                            <span v-else>renew for next month</span>
                        </button>
                        
                        <button 
                            @click="handleCancel" 
                            class="w-full py-2.5 px-4 rounded-full text-sm font-semibold transition-all hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20" 
                            style="color: var(--tf-text-muted); background: rgba(255,255,255,0.05); border: 1px solid var(--tf-border);"
                            :disabled="loading"
                        >
                            <span v-if="loading">Processing...</span>
                            <span v-else>cancel my subscription</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>
