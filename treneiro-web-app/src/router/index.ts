import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('../views/Login.vue') },
    { path: '/register', component: () => import('../views/Register.vue') },
    { path: '/forgot-password', component: () => import('../views/ForgotPassword.vue') },
    { path: '/reset-password', component: () => import('../views/ResetPassword.vue') },
    { path: '/auth/google/callback', component: () => import('../views/GoogleCallback.vue') },
    // ── Public browsing routes (no auth required) ────────────────────────
    { path: '/', component: () => import('../views/Dashboard.vue') },
    { path: '/courses', component: () => import('../views/AllCoursesView.vue') },
    { path: '/courses/:id/:slug?', component: () => import('../views/ClipDetail.vue') },
    { path: '/tags', component: () => import('../views/TagsView.vue') },
    { path: '/tags/:id', component: () => import('../views/TagDetail.vue') },
    { path: '/categories', component: () => import('../views/CategoriesView.vue') },
    { path: '/categories/:id', component: () => import('../views/CategoryDetail.vue') },
    // ── Auth-required routes ─────────────────────────────────────────────
    { path: '/upload', component: () => import('../views/Upload.vue'), meta: { requiresAuth: true } },
    { path: '/courses/:id/edit', component: () => import('../views/EditClip.vue'), meta: { requiresAuth: true } },
    { path: '/my-challenges', component: () => import('../views/MyChallenges.vue'), meta: { requiresAuth: true } },
    { path: '/challenge/:id/:slug?', component: () => import('../views/ClipDetail.vue'), meta: { requiresAuth: true } },
    // ── Admin routes ─────────────────────────────────────────────────────
    { path: '/users', component: () => import('../views/admin/UsersList.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/users/:id/edit', component: () => import('../views/admin/UserEdit.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/categories', component: () => import('../views/admin/CategoriesList.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    // ── Static pages ─────────────────────────────────────────────────────
    { path: '/terms', component: () => import('../views/TermsAndConditions.vue') },
    { path: '/privacy', component: () => import('../views/PrivacyPolicy.vue') },
    { path: '/contact', component: () => import('../views/ContactPage.vue') },
  ],
});

// Modern return-value guard — no deprecated next() callback.
router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login';
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return '/'; // Non-admins redirected to dashboard
  }
});

export default router;
