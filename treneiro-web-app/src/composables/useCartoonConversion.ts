import { ref } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import api from '../api';

export function useCartoonConversion(clipId: string) {
  const cartoonStatus = ref<string | null>(null);
  const cartoonError = ref<string | null>(null);
  const convertingCartoon = ref(false);

  const { pause, resume } = useIntervalFn(
    async () => {
      try {
        const res = await api.get<{ cartoon_status: string | null; cartoon_error: string | null }>(
          `/api/clips/${clipId}/cartoon-status`,
        );
        cartoonStatus.value = res.data.cartoon_status;
        cartoonError.value = res.data.cartoon_error;
        if (res.data.cartoon_status === 'done' || res.data.cartoon_status === 'failed') {
          pause();
        }
      } catch (e) {
        console.error('Cartoon status polling error', e);
      }
    },
    5000,
    { immediate: false },
  );

  async function convertToCartoon() {
    convertingCartoon.value = true;
    try {
      const response = await api.post<{ cartoon_status: string }>(
        `/api/clips/${clipId}/convert-cartoon`,
      );
      cartoonStatus.value = response.data.cartoon_status;
      resume();
    } catch (e: unknown) {
      console.error(e);
      const err = e as { response?: { data?: { message?: string } } };
      cartoonError.value = err.response?.data?.message ?? 'Failed to start conversion';
    } finally {
      convertingCartoon.value = false;
    }
  }

  return {
    cartoonStatus,
    cartoonError,
    convertingCartoon,
    convertToCartoon,
  };
}
