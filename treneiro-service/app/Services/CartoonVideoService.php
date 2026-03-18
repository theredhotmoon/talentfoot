<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CartoonVideoService
{
    protected string $comfyuiUrl;
    protected string $characterRefPath;

    public function __construct()
    {
        $this->comfyuiUrl = config('services.comfyui.url', 'http://127.0.0.1:8188');
        $this->characterRefPath = storage_path('app/comfyui/character_reference.png');
    }

    /**
     * Full pipeline: extract frames → process each via ComfyUI → reassemble video
     */
    public function convert(string $inputVideoPath, string $outputVideoPath): void
    {
        $framesDir = storage_path('app/temp/cartoon_frames_' . uniqid());
        $processedDir = storage_path('app/temp/cartoon_processed_' . uniqid());

        try {
            @mkdir($framesDir, 0755, true);
            @mkdir($processedDir, 0755, true);

            // 1. Get video FPS
            $fps = $this->getVideoFps($inputVideoPath);

            // 2. Extract frames
            Log::info("[CartoonService] Extracting frames from: {$inputVideoPath}");
            $this->extractFrames($inputVideoPath, $framesDir, $fps);

            // 3. Process each frame through ComfyUI
            $frames = glob("{$framesDir}/*.png");
            sort($frames);
            $total = count($frames);
            Log::info("[CartoonService] Processing {$total} frames through ComfyUI");

            foreach ($frames as $i => $framePath) {
                $outputFramePath = $processedDir . '/' . basename($framePath);
                $this->processFrame($framePath, $outputFramePath);
                Log::info("[CartoonService] Frame " . ($i + 1) . "/{$total} done");
            }

            // 4. Extract audio from source
            $audioPath = $framesDir . '/audio.aac';
            $this->extractAudio($inputVideoPath, $audioPath);

            // 5. Reassemble into video
            Log::info("[CartoonService] Reassembling video");
            $this->assembleVideo($processedDir, $audioPath, $outputVideoPath, $fps);

            Log::info("[CartoonService] Cartoon video saved to: {$outputVideoPath}");
        } finally {
            // Cleanup temp files
            $this->cleanupDir($framesDir);
            $this->cleanupDir($processedDir);
        }
    }

    protected function getVideoFps(string $videoPath): float
    {
        $cmd = sprintf(
            'ffprobe -v 0 -of csv=p=0 -select_streams v:0 -show_entries stream=r_frame_rate %s',
            escapeshellarg($videoPath)
        );
        $output = trim(shell_exec($cmd) ?? '30/1');

        // r_frame_rate returns "30/1" or "24000/1001" etc.
        if (str_contains($output, '/')) {
            [$num, $den] = explode('/', $output);
            return (float) $num / max((float) $den, 1);
        }

        return (float) $output ?: 30.0;
    }

    protected function extractFrames(string $videoPath, string $outputDir, float $fps): void
    {
        $cmd = sprintf(
            'ffmpeg -i %s -vf "fps=%s" %s/frame_%%05d.png -y 2>&1',
            escapeshellarg($videoPath),
            $fps,
            escapeshellarg($outputDir)
        );
        shell_exec($cmd);

        $frameCount = count(glob("{$outputDir}/*.png"));
        if ($frameCount === 0) {
            throw new \RuntimeException("Failed to extract frames from video");
        }
    }

    protected function extractAudio(string $videoPath, string $audioPath): void
    {
        $cmd = sprintf(
            'ffmpeg -i %s -vn -acodec aac -b:a 128k %s -y 2>&1',
            escapeshellarg($videoPath),
            escapeshellarg($audioPath)
        );
        shell_exec($cmd);
    }

    protected function assembleVideo(string $framesDir, string $audioPath, string $outputPath, float $fps): void
    {
        $hasAudio = file_exists($audioPath) && filesize($audioPath) > 0;

        if ($hasAudio) {
            $cmd = sprintf(
                'ffmpeg -framerate %s -i %s/frame_%%05d.png -i %s -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest %s -y 2>&1',
                $fps,
                escapeshellarg($framesDir),
                escapeshellarg($audioPath),
                escapeshellarg($outputPath)
            );
        } else {
            $cmd = sprintf(
                'ffmpeg -framerate %s -i %s/frame_%%05d.png -c:v libx264 -pix_fmt yuv420p %s -y 2>&1',
                $fps,
                escapeshellarg($framesDir),
                escapeshellarg($outputPath)
            );
        }

        $result = shell_exec($cmd);

        if (!file_exists($outputPath) || filesize($outputPath) === 0) {
            throw new \RuntimeException("Failed to assemble cartoon video. FFmpeg output: " . ($result ?? 'none'));
        }
    }

    /**
     * Process a single frame through ComfyUI API
     */
    protected function processFrame(string $inputFramePath, string $outputFramePath): void
    {
        // 1. Upload the input frame to ComfyUI
        $inputImageName = $this->uploadImage($inputFramePath);

        // 2. Upload character reference (only once, cached)
        static $charRefName = null;
        if ($charRefName === null) {
            $charRefName = $this->uploadImage($this->characterRefPath);
        }

        // 3. Build and queue the workflow
        $workflow = $this->buildWorkflow($inputImageName, $charRefName);
        $promptId = $this->queuePrompt($workflow);

        // 4. Poll for completion
        $outputImage = $this->waitForResult($promptId);

        // 5. Download and save the output
        $this->downloadImage($outputImage, $outputFramePath);
    }

    protected function uploadImage(string $filePath): string
    {
        $response = Http::attach(
            'image',
            file_get_contents($filePath),
            basename($filePath)
        )->post("{$this->comfyuiUrl}/upload/image");

        if (!$response->successful()) {
            throw new \RuntimeException("Failed to upload image to ComfyUI: " . $response->body());
        }

        return $response->json('name');
    }

    protected function queuePrompt(array $workflow): string
    {
        $response = Http::post("{$this->comfyuiUrl}/prompt", [
            'prompt' => $workflow,
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException("Failed to queue ComfyUI prompt: " . $response->body());
        }

        return $response->json('prompt_id');
    }

    protected function waitForResult(string $promptId, int $timeoutSeconds = 120): string
    {
        $startTime = time();

        while (time() - $startTime < $timeoutSeconds) {
            $response = Http::get("{$this->comfyuiUrl}/history/{$promptId}");

            if ($response->successful()) {
                $history = $response->json();

                if (isset($history[$promptId]['outputs'])) {
                    // Find the SaveImage node output
                    foreach ($history[$promptId]['outputs'] as $nodeId => $output) {
                        if (isset($output['images'][0])) {
                            return $output['images'][0]['filename'];
                        }
                    }
                }

                // Check for errors
                if (
                    isset($history[$promptId]['status']['status_str']) &&
                    $history[$promptId]['status']['status_str'] === 'error'
                ) {
                    throw new \RuntimeException("ComfyUI processing error for prompt {$promptId}");
                }
            }

            sleep(2);
        }

        throw new \RuntimeException("ComfyUI processing timed out after {$timeoutSeconds}s");
    }

    protected function downloadImage(string $filename, string $savePath): void
    {
        $response = Http::get("{$this->comfyuiUrl}/view", [
            'filename' => $filename,
            'type' => 'output',
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException("Failed to download image from ComfyUI: {$filename}");
        }

        file_put_contents($savePath, $response->body());
    }

    /**
     * Build the ComfyUI API workflow for a single frame.
     *
     * Pipeline: Load Source Frame → OpenPose ControlNet → IP-Adapter (character ref) → KSampler → Save
     *
     * Uses SD 1.5 + ToonYou checkpoint.
     */
    protected function buildWorkflow(string $sourceImageName, string $characterRefName): array
    {
        $checkpoint = config('services.comfyui.checkpoint', 'toonyou_beta6.safetensors');
        $ipaModel = config('services.comfyui.ipa_model', 'ip-adapter-faceid-plusv2_sd15.bin');
        $controlnetModel = config('services.comfyui.controlnet_model', 'control_v11p_sd15_openpose.pth');

        return [
            // 1. Load Checkpoint
            "1" => [
                "class_type" => "CheckpointLoaderSimple",
                "inputs" => [
                    "ckpt_name" => $checkpoint,
                ],
            ],
            // 2. Load source frame
            "2" => [
                "class_type" => "LoadImage",
                "inputs" => [
                    "image" => $sourceImageName,
                ],
            ],
            // 3. Load character reference
            "3" => [
                "class_type" => "LoadImage",
                "inputs" => [
                    "image" => $characterRefName,
                ],
            ],
            // 4. OpenPose Preprocessor
            "4" => [
                "class_type" => "OpenposePreprocessor",
                "inputs" => [
                    "image" => ["2", 0],
                    "detect_hand" => "enable",
                    "detect_body" => "enable",
                    "detect_face" => "enable",
                    "resolution" => 512,
                ],
            ],
            // 5. Load ControlNet model
            "5" => [
                "class_type" => "ControlNetLoader",
                "inputs" => [
                    "control_net_name" => $controlnetModel,
                ],
            ],
            // 6. Apply ControlNet
            "6" => [
                "class_type" => "ControlNetApplyAdvanced",
                "inputs" => [
                    "positive" => ["8", 0],
                    "negative" => ["9", 0],
                    "control_net" => ["5", 0],
                    "image" => ["4", 0],
                    "strength" => 0.85,
                    "start_percent" => 0.0,
                    "end_percent" => 1.0,
                ],
            ],
            // 7. IP-Adapter (character consistency)
            "7" => [
                "class_type" => "IPAdapterApply",
                "inputs" => [
                    "model" => ["1", 0],
                    "ipadapter" => ["10", 0],
                    "image" => ["3", 0],
                    "weight" => 0.7,
                    "noise" => 0.0,
                    "weight_type" => "linear",
                    "start_at" => 0.0,
                    "end_at" => 1.0,
                ],
            ],
            // 8. Positive prompt
            "8" => [
                "class_type" => "CLIPTextEncode",
                "inputs" => [
                    "text" => "3d cartoon character, pixar style, bright vivid colors, friendly smile, good looking young male, smooth skin, detailed face, high quality, 4k, clean background",
                    "clip" => ["1", 1],
                ],
            ],
            // 9. Negative prompt
            "9" => [
                "class_type" => "CLIPTextEncode",
                "inputs" => [
                    "text" => "realistic, photo, blurry, low quality, deformed, ugly, dark, gloomy, nsfw",
                    "clip" => ["1", 1],
                ],
            ],
            // 10. Load IP-Adapter model
            "10" => [
                "class_type" => "IPAdapterModelLoader",
                "inputs" => [
                    "ipadapter_file" => $ipaModel,
                ],
            ],
            // 11. Empty Latent (for img2img, get dimensions from source)
            "11" => [
                "class_type" => "VAEEncode",
                "inputs" => [
                    "pixels" => ["2", 0],
                    "vae" => ["1", 2],
                ],
            ],
            // 12. KSampler
            "12" => [
                "class_type" => "KSampler",
                "inputs" => [
                    "model" => ["7", 0],
                    "positive" => ["6", 0],
                    "negative" => ["6", 1],
                    "latent_image" => ["11", 0],
                    "seed" => 42, // Fixed seed for consistency across frames
                    "steps" => 20,
                    "cfg" => 7.0,
                    "sampler_name" => "euler_ancestral",
                    "scheduler" => "normal",
                    "denoise" => 0.55, // Lower = more faithfulness to source, higher = more stylized
                ],
            ],
            // 13. VAE Decode
            "13" => [
                "class_type" => "VAEDecode",
                "inputs" => [
                    "samples" => ["12", 0],
                    "vae" => ["1", 2],
                ],
            ],
            // 14. Save Image
            "14" => [
                "class_type" => "SaveImage",
                "inputs" => [
                    "images" => ["13", 0],
                    "filename_prefix" => "cartoon_frame",
                ],
            ],
        ];
    }

    protected function cleanupDir(string $dir): void
    {
        if (!is_dir($dir))
            return;

        $files = glob("{$dir}/*");
        foreach ($files as $file) {
            if (is_file($file))
                @unlink($file);
        }
        @rmdir($dir);
    }
}
