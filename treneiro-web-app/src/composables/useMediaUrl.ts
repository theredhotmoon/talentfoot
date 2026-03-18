export function useMediaUrl() {
    const getVideoUrl = (path: string): string => {
        return `/storage/${path}`;
    };

    const getThumbnailUrl = (path: string | undefined): string => {
        if (!path) return '';
        return `/storage/${path}`;
    };

    const getCaptionUrl = (path: string): string => {
        return `/storage/${path}`;
    };

    return { getVideoUrl, getThumbnailUrl, getCaptionUrl };
}
