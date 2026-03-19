<?php

namespace App\Http\Controllers;

use App\Models\Clip;
use App\Models\Subclip;
use App\Models\SubclipRating;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SubclipController extends Controller
{
    public function store(Request $request, Clip $clip)
    {
        // Enforce max 10 subclips
        if ($clip->subclips()->count() >= 10) {
            return response()->json(['error' => 'Maximum 10 subclips per clip'], 422);
        }

        $request->validate([
            'name' => 'required',
            'video_file' => 'required|file|mimetypes:video/mp4,video/quicktime|max:51200',
            'difficulty' => 'required|integer|min:1|max:10',
        ]);

        if (!$request->hasFile('video_file')) {
            return response()->json(['error' => 'No video file provided'], 422);
        }

        $path = $request->file('video_file')->store('subclips', 'public');

        // Handle translations for name
        $name = $request->name;
        if (is_string($name) && is_array(json_decode($name, true))) {
            $name = json_decode($name, true);
        }

        $sortOrder = $clip->subclips()->max('sort_order') ?? 0;
        $sortOrder++;

        $subclip = Subclip::create([
            'clip_id' => $clip->id,
            'name' => $name,
            'file_path' => $path,
            'difficulty' => (int) $request->difficulty,
            'sort_order' => $sortOrder,
        ]);

        // Handle Thumbnails
        if ($request->hasFile('thumbnails')) {
            $thumbnailPaths = [];
            foreach ($request->file('thumbnails') as $file) {
                $thumbPath = $file->store("thumbnails/subclips/{$subclip->id}", 'public');
                $thumbnailPaths[] = $thumbPath;
            }
            $subclip->update(['thumbnails' => $thumbnailPaths]);
        } else {
            // Fallback: generate thumbnails server-side using FFmpeg
            $thumbnailPaths = $this->generateSubclipThumbnails($subclip);
            if (!empty($thumbnailPaths)) {
                $subclip->update(['thumbnails' => $thumbnailPaths]);
            }
        }

        // Handle Captions
        $captions = [];
        foreach (['en', 'pl', 'es'] as $lang) {
            if ($request->hasFile("captions_{$lang}")) {
                $captions[$lang] = $request->file("captions_{$lang}")->store("captions/subclips/{$subclip->id}", 'public');
            }
        }
        if (!empty($captions)) {
            $subclip->update(['captions' => $captions]);
        }

        return response()->json($subclip, 201);
    }

    public function update(Request $request, Subclip $subclip)
    {
        // FormData sends objects as JSON strings — decode before validation
        $nameVal = $request->input('name');
        if (is_string($nameVal) && is_array(json_decode($nameVal, true))) {
            $request->merge(['name' => json_decode($nameVal, true)]);
        }

        $validated = $request->validate([
            'name' => 'sometimes|array',
            'difficulty' => 'sometimes|integer|min:1|max:10',
            'sort_order' => 'sometimes|integer|min:0',
            'is_preview' => 'sometimes|boolean',
        ]);

        if (isset($validated['name'])) {
            $subclip->setTranslations('name', $validated['name']);
        }

        if (isset($validated['difficulty'])) {
            $subclip->difficulty = $validated['difficulty'];
        }

        if (isset($validated['sort_order'])) {
            $subclip->sort_order = $validated['sort_order'];
        }

        if (isset($validated['is_preview'])) {
            $subclip->is_preview = $validated['is_preview'];
        }

        // Handle Captions upload/update
        $captions = $subclip->captions ?? [];
        foreach (['en', 'pl', 'es'] as $lang) {
            if ($request->hasFile("captions_{$lang}")) {
                if (isset($captions[$lang]) && Storage::disk('public')->exists($captions[$lang])) {
                    Storage::disk('public')->delete($captions[$lang]);
                }
                $captions[$lang] = $request->file("captions_{$lang}")->store("captions/subclips/{$subclip->id}", 'public');
            }
        }
        $subclip->captions = $captions;

        $subclip->save();

        return response()->json($subclip);
    }

    public function destroy(Subclip $subclip)
    {
        // Delete video file
        if (Storage::disk('public')->exists($subclip->file_path)) {
            Storage::disk('public')->delete($subclip->file_path);
        }

        // Delete thumbnails
        if ($subclip->thumbnails) {
            foreach ($subclip->thumbnails as $thumb) {
                if (Storage::disk('public')->exists($thumb)) {
                    Storage::disk('public')->delete($thumb);
                }
            }
        }

        // Delete captions
        if ($subclip->captions) {
            foreach ($subclip->captions as $cap) {
                if (Storage::disk('public')->exists($cap)) {
                    Storage::disk('public')->delete($cap);
                }
            }
        }

        $subclip->delete();
        return response()->json(['message' => 'Subclip deleted']);
    }

    public function recordView(Subclip $subclip)
    {
        $subclip->increment('views');
        return response()->json(['views' => $subclip->views]);
    }

    public function rate(Request $request, Subclip $subclip)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:10',
        ]);

        SubclipRating::updateOrCreate(
            [
                'user_id' => auth()->id(),
                'subclip_id' => $subclip->id,
            ],
            [
                'rating' => $request->rating,
            ]
        );

        $avg = $subclip->ratings()->avg('rating');
        $count = $subclip->ratings()->count();

        $subclip->update([
            'average_rating' => $avg,
            'ratings_count' => $count,
        ]);

        return response()->json([
            'average_rating' => round($avg, 1),
            'ratings_count' => $count,
        ]);
    }

    /**
     * Generate thumbnails from a subclip video using FFmpeg.
     */
    private function generateSubclipThumbnails(Subclip $subclip): array
    {
        try {
            $videoPath = Storage::disk('public')->path($subclip->file_path);

            if (!file_exists($videoPath)) {
                \Illuminate\Support\Facades\Log::warning("Subclip thumbnail generation: video not found at {$videoPath}");
                return [];
            }

            $durationCmd = sprintf(
                'ffprobe -v error -show_entries format=duration -of csv=p=0 %s 2>&1',
                escapeshellarg($videoPath)
            );
            $duration = trim(shell_exec($durationCmd));

            if (!$duration || !is_numeric($duration) || (float) $duration <= 0) {
                return [];
            }

            $duration = (float) $duration;
            $timePoints = [0, 0.25, 0.5, 0.75, 0.99];
            $thumbnailPaths = [];

            $thumbDir = "thumbnails/subclips/{$subclip->id}";
            Storage::disk('public')->makeDirectory($thumbDir);

            foreach ($timePoints as $index => $point) {
                $seekTime = $duration * $point;
                $outputFile = Storage::disk('public')->path("{$thumbDir}/thumb_{$index}.jpg");

                $cmd = sprintf(
                    'ffmpeg -ss %s -i %s -vframes 1 -q:v 3 %s -y 2>&1',
                    escapeshellarg(number_format($seekTime, 3, '.', '')),
                    escapeshellarg($videoPath),
                    escapeshellarg($outputFile)
                );

                shell_exec($cmd);

                if (file_exists($outputFile) && filesize($outputFile) > 0) {
                    $thumbnailPaths[] = "{$thumbDir}/thumb_{$index}.jpg";
                }
            }

            return $thumbnailPaths;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Subclip thumbnail generation failed: " . $e->getMessage());
            return [];
        }
    }
}
