export function useExtractThumbnails() {
    const extractThumbnails = async (videoFile: File): Promise<Blob[]> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const snapshots: Blob[] = [];
            const timePoints = [0, 0.25, 0.5, 0.75, 0.99];
            let currentPoint = 0;

            if (!context) {
                reject(new Error('Canvas context not supported'));
                return;
            }

            video.preload = 'metadata';
            video.src = URL.createObjectURL(videoFile);
            video.muted = true;

            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                video.currentTime = video.duration * (timePoints[0] ?? 0);
            };

            video.onseeked = () => {
                context!.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) snapshots.push(blob);

                    currentPoint++;
                    if (currentPoint < timePoints.length) {
                        video.currentTime = video.duration * (timePoints[currentPoint] ?? 0);
                    } else {
                        resolve(snapshots);
                        URL.revokeObjectURL(video.src);
                    }
                }, 'image/jpeg', 0.7);
            };

            video.onerror = () => {
                reject(new Error('Error loading video'));
            };
        });
    };

    return { extractThumbnails };
}
