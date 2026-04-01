<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useBreadcrumbLabel } from '../composables/useBreadcrumbLabel';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { getBreadcrumbLabel } = useBreadcrumbLabel();

const breadcrumbs = computed(() => {
    const paths = route.path.split('/').filter(p => !!p);
    const crumbs = [];
    
    // Always start with Home
    crumbs.push({ name: t('nav.home') || 'Home', path: '/' });

    let currentPath = '';
    
    // Custom handling for specific routes to make them user friendly
    for (let i = 0; i < paths.length; i++) {
        const seg = paths[i];
        if (!seg) continue;
        currentPath += `/${seg}`;
        
        let label = seg;
        
        // Match specific segments to translations
        if (seg === 'clips') label = t('nav.courses') || 'Courses';
        if (seg === 'tags') label = t('nav.tags') || 'Tags';
        if (seg === 'categories') label = t('nav.categories') || 'Categories';
        if (seg === 'my-challenges') label = t('nav.my_challenges') || 'My Challenges';
        
        // Check if a view has registered a human-readable label for this segment (e.g. tag/category names)
        const registeredLabel = getBreadcrumbLabel(seg);
        if (registeredLabel) {
            label = registeredLabel;
        } else if (seg.length > 20 || /^\d+$/.test(seg)) {
            // If it looks like an ID or slug (long mixed string), try to check params or make it nicer
            // Usually we might want to skip IDs in breadcrumbs if we have a slug following it
            if (i < paths.length - 1 && paths[0] === 'courses') {
                continue; // Skip the UUID/ID part in courses/:id/:slug
            }
        }
        
        // If it's a slug, format it slightly better, remove dashes
        if (i === paths.length - 1 && paths[0] === 'courses' && seg !== 'courses') {
            label = seg.replace(/-/g, ' ');
            label = label.charAt(0).toUpperCase() + label.slice(1);
        }

        crumbs.push({
            name: label ? (label.charAt(0).toUpperCase() + label.slice(1)) : seg,
            path: currentPath
        });
    }

    // De-duplicate contiguous steps that might just be ID -> Slug
    return crumbs;
});

const handleBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/');
    }
};
</script>

<template>
  <div class="breadcrumb-bar">
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li v-for="(crumb, index) in breadcrumbs" :key="crumb.path" class="breadcrumb-item">
          <router-link
            v-if="index < breadcrumbs.length - 1"
            :to="crumb.path"
            class="breadcrumb-link"
          >
            {{ crumb.name }}
          </router-link>
          <span v-else class="breadcrumb-current">
            {{ crumb.name }}
          </span>
          
          <svg 
              v-if="index < breadcrumbs.length - 1" 
              class="breadcrumb-separator" 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </li>
      </ol>
    </nav>

    <button @click="handleBack" class="breadcrumb-back" :title="t('nav.back') || 'Back'">
      <svg xmlns="http://www.w3.org/2000/svg" class="breadcrumb-back-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span class="breadcrumb-back-label">{{ t('nav.back') || 'Back' }}</span>
    </button>
  </div>
</template>

<style scoped>
.breadcrumb-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  margin-bottom: 8px;
  min-height: 0;
}

.breadcrumb-nav {
  min-width: 0;
  flex: 1;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 2px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.breadcrumb-link {
  font-size: 0.75rem;
  line-height: 1;
  color: var(--tf-text-muted, #9ca3af);
  text-decoration: none;
  transition: color 0.15s ease;
  white-space: nowrap;
}

.breadcrumb-link:hover {
  color: var(--tf-text, #f3f4f6);
}

.breadcrumb-current {
  font-size: 0.75rem;
  line-height: 1;
  color: var(--tf-text-secondary, #d1d5db);
  cursor: default;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

@media (min-width: 640px) {
  .breadcrumb-current {
    max-width: 320px;
  }
}

.breadcrumb-separator {
  width: 10px;
  height: 10px;
  color: var(--tf-text-muted, #6b7280);
  flex-shrink: 0;
  margin: 0 1px;
}

/* Back button — minimal, right-aligned */
.breadcrumb-back {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--tf-text-muted, #9ca3af);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
  flex-shrink: 0;
  font-size: 0.7rem;
  line-height: 1;
}

.breadcrumb-back:hover {
  color: var(--tf-text, #f3f4f6);
  background: var(--tf-bg-surface, rgba(255,255,255,0.06));
}

.breadcrumb-back-icon {
  width: 12px;
  height: 12px;
}

.breadcrumb-back-label {
  font-weight: 500;
}
</style>
