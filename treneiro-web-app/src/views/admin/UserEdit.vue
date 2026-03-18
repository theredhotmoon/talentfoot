<template>
  <div class=" max-w-2xl">
    <router-link to="/users" class=" hover:text-white mb-4 inline-block" style="color: var(--tf-accent-cyan)">&larr; {{ $t('users.back_to_list') }}</router-link>
    
    <div class="bg-gray-800 p-8 rounded shadow-lg">
        <h1 class="text-3xl font-bold mb-6">{{ $t('users.edit_user') }}</h1>

        <div v-if="loading" class="text-center">{{ $t('common.loading') }}</div>

        <form v-else @submit.prevent="saveUser">
            <div class="mb-4">
                <label class="block text-gray-400 mb-2">{{ $t('users.name') }}</label>
                <input v-model="form.name" type="text" required class="w-full bg-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div class="mb-4">
                <label class="block text-gray-400 mb-2">{{ $t('users.email') }}</label>
                <input v-model="form.email" type="email" required class="w-full bg-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div class="mb-4">
                <label class="block text-gray-400 mb-2">{{ $t('users.role') }}</label>
                <select v-model="form.role" class="w-full bg-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            <div class="mb-6">
                <label class="block text-gray-400 mb-2">{{ $t('users.password_reset') }} ({{ $t('users.optional') }})</label>
                <input v-model="form.password" type="password" class="w-full bg-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="New Password">
            </div>

            <div class="mb-6">
                <label class="block text-gray-400 mb-2">{{ $t('users.subscription') }}</label>
                <input v-model="form.subscription_valid_until" type="date" class="w-full bg-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <p class="text-xs text-gray-500 mt-1">{{ $t('users.subscription_help') }}</p>
            </div>

            <div class="flex justify-end gap-4">
                <button type="button" @click="$router.push('/users')" class="px-4 py-2 text-gray-400 hover:text-white">{{ $t('common.cancel') }}</button>
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold transition">{{ $t('common.save') }}</button>
            </div>
        </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const id = route.params.id;

const loading = ref(true);
const form = ref({
    name: '',
    email: '',
    role: 'user',
    password: '',
    subscription_valid_until: '' as string | null
});

onMounted(async () => {
    try {
        const response = await axios.get(`http://localhost:8000/api/users/${id}`);
        form.value.name = response.data.name;
        form.value.email = response.data.email;
        form.value.role = response.data.role;
        form.value.subscription_valid_until = response.data.subscription_valid_until || '';
    } catch (e) {
        console.error(e);
        alert('Failed to load user');
        router.push('/users'); // redirect back
    } finally {
        loading.value = false;
    }
});

const saveUser = async () => {
    try {
        await axios.put(`http://localhost:8000/api/users/${id}`, form.value);
        alert(t('users.saved_success'));
        router.push('/users');
    } catch (e: any) {
        console.error(e);
        alert(e.response?.data?.message || 'Failed to update user');
    }
};
</script>
