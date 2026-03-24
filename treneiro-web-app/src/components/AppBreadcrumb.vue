<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const { t } = useI18n();

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
        
        // If it looks like an ID or slug (long mixed string), try to check params or make it nicer
        if (seg.length > 20 || /^\d+$/.test(seg)) {
            // Usually we might want to skip IDs in breadcrumbs if we have a slug following it
            if (i < paths.length - 1 && paths[0] === 'clips') {
                continue; // Skip the UUID/ID part in clips/:id/:slug
            }
        }
        
        // If it's a slug, format it slightly better, remove dashes
        if (i === paths.length - 1 && paths[0] === 'clips' && seg !== 'clips') {
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
</script>

<template>
  <nav class="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 py-2 px-1">
    <ol class="flex items-center space-x-2">
      <li v-for="(crumb, index) in breadcrumbs" :key="crumb.path" class="flex items-center">
        <router-link
          v-if="index < breadcrumbs.length - 1"
          :to="crumb.path"
          class="hover:text-gray-900 dark:hover:text-white transition-colors duration-200 flex items-center"
        >
          {{ crumb.name }}
        </router-link>
        <span v-else class="text-gray-800 dark:text-gray-200 cursor-default truncate max-w-[200px] sm:max-w-xs">
          {{ crumb.name }}
        </span>
        
        <svg 
            v-if="index < breadcrumbs.length - 1" 
            class="w-4 h-4 mx-2 text-gray-400 dark:text-gray-600 flex-shrink-0" 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </li>
    </ol>
  </nav>
</template>
