import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Dashboard from '../views/Dashboard.vue';
import Upload from '../views/Upload.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/login', component: Login },
        { path: '/register', component: Register },
        { path: '/auth/google/callback', component: () => import('../views/GoogleCallback.vue') },
        { path: '/', component: Dashboard, meta: { requiresAuth: true } },
        { path: '/upload', component: Upload, meta: { requiresAuth: true } },
        { path: '/clips/:id/:slug?', component: () => import('../views/ClipDetail.vue'), meta: { requiresAuth: true } },
        { path: '/clips/:id/edit', component: () => import('../views/EditClip.vue'), meta: { requiresAuth: true } },
        { path: '/tags', component: () => import('../views/TagsView.vue'), meta: { requiresAuth: true } },
        { path: '/tags/:id', component: () => import('../views/TagDetail.vue'), meta: { requiresAuth: true } },
        { path: '/users', component: () => import('../views/admin/UsersList.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
        { path: '/users/:id/edit', component: () => import('../views/admin/UserEdit.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
        { path: '/categories', component: () => import('../views/admin/CategoriesList.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
        { path: '/categories/:id', component: () => import('../views/CategoryDetail.vue'), meta: { requiresAuth: true } },
        { path: '/my-challenges', component: () => import('../views/MyChallenges.vue'), meta: { requiresAuth: true } },
        { path: '/terms', component: () => import('../views/TermsAndConditions.vue') },
        { path: '/privacy', component: () => import('../views/PrivacyPolicy.vue') },
        { path: '/contact', component: () => import('../views/ContactPage.vue') },
    ],
});

router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore();
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login');
    } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
        next('/'); // Redirect non-admins to dashboard
    } else {
        next();
    }
});

export default router;
