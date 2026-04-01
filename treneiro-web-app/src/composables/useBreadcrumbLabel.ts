/**
 * Singleton breadcrumb label store.
 * Views register human-readable labels for raw URL segments (UUIDs, numeric IDs, etc.)
 * so that AppBreadcrumb can display meaningful names.
 */

import { reactive } from 'vue';

// Module-level reactive map: URL segment → display label
const labels = reactive<Record<string, string>>({});

export function useBreadcrumbLabel() {
    const setBreadcrumbLabel = (segment: string, label: string) => {
        if (segment && label) {
            labels[String(segment)] = label;
        }
    };

    const getBreadcrumbLabel = (segment: string): string | undefined => {
        return labels[String(segment)];
    };

    return { setBreadcrumbLabel, getBreadcrumbLabel };
}
