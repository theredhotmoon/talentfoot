import type { Clip } from '../types';

export function useThumbnailPreview() {
  const startPreview = (clip: Clip) => {
    if (clip.thumbnails && clip.thumbnails.length > 0) {
      clip.activeThumbnail = clip.thumbnails[0];
    }
  };

  const stopPreview = (clip: Clip) => {
    clip.activeThumbnail = undefined;
  };

  const updatePreview = (event: MouseEvent, clip: Clip) => {
    if (!clip.thumbnails || clip.thumbnails.length === 0) return;

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;

    const index = Math.floor((x / width) * clip.thumbnails.length);
    const safeIndex = Math.min(Math.max(index, 0), clip.thumbnails.length - 1);

    clip.activeThumbnail = clip.thumbnails[safeIndex];
  };

  return { startPreview, stopPreview, updatePreview };
}
