import { defineStore } from 'pinia';
import axios from 'axios';
import router from '../router';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    auth_provider?: string | null;
    show_tips?: boolean;
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as User | null,
        token: localStorage.getItem('token') || '',
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
        isAdmin: (state) => state.user?.role === 'admin',
        showTips: (state) => state.user?.show_tips ?? true,
    },
    actions: {
        async login(credentials: any) {
            const response = await axios.post('/api/login', credentials);
            this.token = response.data.access_token;
            this.user = response.data.user;
            localStorage.setItem('token', this.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
            router.push('/');
        },
        async register(credentials: any) {
            const response = await axios.post('/api/register', credentials);
            this.token = response.data.access_token;
            localStorage.setItem('token', this.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
            // Fetch user
            await this.fetchUser();
            router.push('/');
        },
        async logout() {
            try {
                await axios.post('/api/logout');
            } catch (e) {
                console.error(e);
            }
            this.token = '';
            this.user = null;
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            router.push('/login');
        },
        async fetchUser() {
            if (!this.token) return;
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
                const response = await axios.get('/api/user');
                this.user = response.data;
            } catch (error) {
                console.error("Fetch user failed", error);
                this.token = '';
                localStorage.removeItem('token');
            }
        },
        async setTokenAndFetchUser(token: string) {
            this.token = token;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            await this.fetchUser();
        },
        async updateShowTips(value: boolean) {
            try {
                const response = await axios.put('/api/profile/tips', {
                    show_tips: value,
                });
                this.user = response.data;
            } catch (error) {
                console.error("Update show_tips failed", error);
            }
        },
    },
});
