import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useSortFilterSync(defaultSortBy = 'created_at', defaultSortOrder = 'desc') {
    const route = useRoute();
    const router = useRouter();

    const sortBy = ref(defaultSortBy);
    const sortOrder = ref(defaultSortOrder);
    const selectedCategory = ref('');
    const page = ref(1);

    // Initialize from URL
    const initFromQuery = () => {
        if (route.query.sort) sortBy.value = route.query.sort as string;
        if (route.query.order) sortOrder.value = route.query.order as string;
        if (route.query.category) selectedCategory.value = route.query.category as string;
        if (route.query.page) page.value = parseInt(route.query.page as string) || 1;
    };

    // Update URL when values change (call this from SortFilterBar @change)
    const updateQuery = () => {
        const query: Record<string, string> = {
            ...route.query as Record<string, string>,
            sort: sortBy.value,
            order: sortOrder.value,
            page: page.value.toString(),
        };
        if (selectedCategory.value) {
            query.category = selectedCategory.value;
        } else {
            delete query.category;
        }
        
        // Use replace instead of push to avoid cluttering history with filter changes,
        // Wait, the user requirement for Back button specifically says:
        // "back button should move me to tags view (include pagination, sorting and filtering)."
        // Standard behavior is push for explicit filter changes so back undoes the filter,
        // OR replace and back goes to previous page but keeps filters if we pushed before?
        // Actually, if we use push, 'Back' undoes the filter. If we use replace, 'Back' goes to the previous list.
        // Let's use replace for now, so back goes exactly to the previous logical page, but with the current filters intact. Wait, if I am on Course A, and click Back, I go to CourseList. The CourseList URL will have the filters. 
        // We will use replace to update the URL without adding history bloat for every small filter tweak.
        router.replace({ query });
    };

    onMounted(initFromQuery);

    return {
        sortBy,
        sortOrder,
        selectedCategory,
        page,
        updateQuery,
        initFromQuery
    };
}
