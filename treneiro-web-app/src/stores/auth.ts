import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import api from '../api';
import router from '../router';
import type { User, LoginCredentials, RegisterCredentials } from '../types';

export const useAuthStore = defineStore('auth', () => {
  const token = useLocalStorage<string>('token', '');
  const user = ref<User | null>(null);
  const isInitialized = ref(false);
  const showRegisterModal = ref(false);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const showTips = computed(() => user.value?.show_tips ?? true);

  async function login(credentials: LoginCredentials): Promise<void> {
    const response = await api.post<{ access_token: string; user: User }>(
      '/api/login',
      credentials,
    );
    token.value = response.data.access_token;
    user.value = response.data.user;
    router.push('/');
  }

  async function register(credentials: RegisterCredentials, redirect: boolean = true): Promise<void> {
    const response = await api.post<{ access_token: string }>(
      '/api/register',
      credentials,
    );
    token.value = response.data.access_token;
    await fetchUser();
    if (redirect) {
      router.push('/');
    }
  }

  async function logout(): Promise<void> {
    try {
      await api.post('/api/logout');
    } catch (e) {
      console.error(e);
    }
    token.value = '';
    user.value = null;
    router.push('/login');
  }

  async function fetchUser(): Promise<void> {
    if (!token.value) {
      isInitialized.value = true;
      return;
    }
    try {
      const response = await api.get<User>('/api/user');
      user.value = response.data;
    } catch (error) {
      console.error('Fetch user failed', error);
      token.value = '';
    } finally {
      isInitialized.value = true;
    }
  }

  async function setTokenAndFetchUser(newToken: string): Promise<void> {
    token.value = newToken;
    await fetchUser();
  }

  async function updateShowTips(value: boolean): Promise<void> {
    try {
      const response = await api.put<User>('/api/profile/tips', {
        show_tips: value,
      });
      user.value = response.data;
    } catch (error) {
      console.error('Update show_tips failed', error);
    }
  }

  return {
    token,
    user,
    isInitialized,
    showRegisterModal,
    isAuthenticated,
    isAdmin,
    showTips,
    login,
    register,
    logout,
    fetchUser,
    setTokenAndFetchUser,
    updateShowTips,
  };
});
