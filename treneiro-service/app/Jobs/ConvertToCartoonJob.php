<?php

namespace App\Jobs;

use App\Models\Clip;
use App\Services\CartoonVideoService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ConvertToCartoonJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 3600; // 1 hour max
    public int $tries = 1;

    public function __construct(
        protected string $clipId
    ) {
    }

    public function handle(CartoonVideoService $service): void
    {
        $clip = Clip::find($this->clipId);

        if (!$clip) {
            Log::error("[CartoonJob] Clip not found: {$this->clipId}");
            return;
        }

        try {
            $clip->update(['cartoon_status' => 'processing', 'cartoon_error' => null]);

            $inputPath = Storage::disk('public')->path($clip->file_path);
            $outputFilename = 'cartoon_clips/' . $clip->id . '_cartoon.mp4';
            $outputPath = Storage::disk('public')->path($outputFilename);

            // Ensure output directory exists
            $outputDir = dirname($outputPath);
            if (!is_dir($outputDir)) {
                mkdir($outputDir, 0755, true);
            }

            $service->convert($inputPath, $outputPath);

            $clip->update([
                'cartoon_file_path' => $outputFilename,
                'cartoon_status' => 'done',
                'cartoon_error' => null,
            ]);

            Log::info("[CartoonJob] Successfully converted clip {$clip->id} to cartoon");
        } catch (\Throwable $e) {
            Log::error("[CartoonJob] Failed for clip {$clip->id}: " . $e->getMessage());

            $clip->update([
                'cartoon_status' => 'failed',
                'cartoon_error' => $e->getMessage(),
            ]);
        }
    }
}
