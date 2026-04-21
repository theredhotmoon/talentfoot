<template>
  <div class="">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
            <h1 class="font-heading font-extrabold text-3xl gradient-text">{{ $t('users.title') }}</h1>
            <p class="text-sm mt-1" style="color: var(--tf-text-muted);">{{ $t('users.subtitle') }}</p>
        </div>
        <div class="flex gap-3">
             <input 
                v-model="search" 
                @input="debounceSearch"
                type="text" 
                :placeholder="$t('users.search_placeholder')" 
                class="input-modern text-sm py-2 px-4"
            >
            <select v-model="roleFilter" @change="fetchUsers" :aria-label="$t('users.role') || 'Role'" class="select-modern text-sm py-2 px-4">
                <option value="">{{ $t('users.all_roles') }}</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
            </select>
        </div>
    </div>

    <div v-if="loading" class="text-center">{{ $t('common.loading') }}</div>
    
    <div v-else class="card-static shadow overflow-hidden">
        <table class="w-full text-left">
            <thead class="bg-gray-700">
                <tr>
                    <th class="p-4 cursor-pointer hover:bg-gray-600" @click="sort('name')">
                        {{ $t('users.name') }} <span v-if="sortBy === 'name'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                    </th>
                    <th class="p-4 cursor-pointer hover:bg-gray-600" @click="sort('email')">
                        {{ $t('users.email') }} <span v-if="sortBy === 'email'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                    </th>
                    <th class="p-4 cursor-pointer hover:bg-gray-600" @click="sort('role')">
                        {{ $t('users.role') }} <span v-if="sortBy === 'role'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                    </th>
                    <th class="p-4 cursor-pointer hover:bg-gray-600" @click="sort('created_at')">
                        {{ $t('users.created_at') }} <span v-if="sortBy === 'created_at'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                    </th>
                    <th class="p-4">{{ $t('users.actions') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="user in users" :key="user.id" class="border-t" style="border-color: var(--tf-border);">
                    <td class="p-4">{{ user.name }}</td>
                    <td class="p-4">{{ user.email }}</td>
                    <td class="p-4">
                        <span :style="user.role === 'admin' ? 'color: var(--tf-accent-violet);' : 'color: var(--tf-text-dimmed);'">
                            {{ user.role }}
                        </span>
                    </td>
                    <td class="p-4">{{ new Date(user.created_at).toLocaleDateString() }}</td>
                    <td class="p-4 flex gap-2">
                        <router-link :to="`/users/${user.id}/edit`" class="btn-ghost text-sm py-1 px-3">
                             {{ $t('common.edit') }}
                        </router-link>
                        <button @click="confirmDeleteUser(user)" class="btn-danger text-sm py-1 px-3">
                             {{ $t('common.delete') }}
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        
        <!-- Pagination (Simple) -->
        <div class="p-4 flex justify-between items-center" style="background: rgba(255,255,255,0.04);" v-if="pagination.last_page > 1">
            <button 
                @click="changePage(pagination.current_page - 1)" 
                :disabled="pagination.current_page <= 1"
                class="px-4 py-2 bg-gray-600 rounded disabled:opacity-50"
            >
                {{ $t('common.prev') }}
            </button>
            <span>{{ pagination.current_page }} / {{ pagination.last_page }}</span>
            <button 
                @click="changePage(pagination.current_page + 1)" 
                :disabled="pagination.current_page >= pagination.last_page"
                class="px-4 py-2 bg-gray-600 rounded disabled:opacity-50"
            >
                {{ $t('common.next') }}
            </button>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
        v-if="showDeleteConfirm && userToDelete"
        :title="$t('users.actions')"
        :message="$t('users.confirm_delete', { name: userToDelete.name })"
        :confirm-label="$t('common.delete') || 'Delete'"
        :cancel-label="$t('common.cancel') || 'Cancel'"
        :danger="true"
        @confirm="deleteUser"
        @cancel="showDeleteConfirm = false; userToDelete = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';
import { useI18n } from 'vue-i18n';
import { useToast } from '../../composables/useToast';
import ConfirmModal from '../../components/ConfirmModal.vue';

const { t } = useI18n();
const { showToast } = useToast();

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

const users = ref<User[]>([]);
const loading = ref(true);
const search = ref('');
const roleFilter = ref('');
const sortBy = ref('created_at');
const sortOrder = ref('desc');
const pagination = ref({
    current_page: 1,
    last_page: 1,
    total: 0
});

const showDeleteConfirm = ref(false);
const userToDelete = ref<User | null>(null);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const debounceSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        pagination.value.current_page = 1;
        fetchUsers();
    }, 300);
};

const sort = (field: string) => {
    if (sortBy.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortBy.value = field;
        sortOrder.value = 'asc';
    }
    fetchUsers();
};

const changePage = (page: number) => {
    pagination.value.current_page = page;
    fetchUsers();
};

const fetchUsers = async () => {
    loading.value = true;
    try {
        const response = await api.get('/api/users', {
            params: {
                page: pagination.value.current_page,
                search: search.value,
                role: roleFilter.value,
                sort: sortBy.value,
                order: sortOrder.value
            }
        });
        users.value = response.data.data;
        pagination.value = {
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            total: response.data.total
        };
    } catch (e) {
        console.error(e);
        showToast({ title: 'Error', message: 'Failed to load users', type: 'error' });
    } finally {
        loading.value = false;
    }
};

const confirmDeleteUser = (user: User) => {
    userToDelete.value = user;
    showDeleteConfirm.value = true;
};

const deleteUser = async () => {
    if (!userToDelete.value) return;
    showDeleteConfirm.value = false;
    try {
        await api.delete(`/api/users/${userToDelete.value.id}`);
        userToDelete.value = null;
        fetchUsers();
    } catch (e: any) {
        showToast({ title: 'Error', message: e.response?.data?.message || 'Failed to delete user', type: 'error' });
        userToDelete.value = null;
    }
};

onMounted(fetchUsers);
</script>
