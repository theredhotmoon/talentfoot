<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    /**
     * GET /api/health/dependencies
     *
     * Returns a comprehensive report of system dependencies,
     * PHP configuration, and environment readiness.
     */
    public function dependencies()
    {
        $report = [
            'status' => 'ok',
            'checked_at' => now()->toIso8601String(),
            'php_version' => PHP_VERSION,
            'extensions' => $this->checkExtensions(),
            'php_limits' => $this->checkPhpLimits(),
            'storage' => $this->checkStorage(),
            'database' => $this->checkDatabase(),
        ];

        // Determine overall status
        $hasFailure = false;

        foreach ($report['extensions'] as $ext) {
            if (!$ext['loaded']) {
                $hasFailure = true;
            }
        }

        foreach ($report['php_limits'] as $limit) {
            if (!$limit['ok']) {
                $hasFailure = true;
            }
        }

        foreach ($report['storage'] as $dir) {
            if (!$dir['writable']) {
                $hasFailure = true;
            }
        }

        if (!$report['database']['connected']) {
            $hasFailure = true;
        }

        $report['status'] = $hasFailure ? 'degraded' : 'ok';

        $statusCode = $hasFailure ? 503 : 200;

        return response()->json($report, $statusCode);
    }

    private function checkExtensions(): array
    {
        $required = [
            'fileinfo' => 'MIME type detection for file uploads',
            'pdo_mysql' => 'MySQL/MariaDB database connectivity',
            'zip' => 'ZIP archive handling',
            'bcmath' => 'Arbitrary precision mathematics',
            'mbstring' => 'Multibyte string support',
            'tokenizer' => 'PHP tokenizer for code parsing',
            'json' => 'JSON encoding/decoding',
            'openssl' => 'SSL/TLS encryption',
        ];

        $results = [];
        foreach ($required as $ext => $purpose) {
            $results[] = [
                'name' => $ext,
                'loaded' => extension_loaded($ext),
                'purpose' => $purpose,
            ];
        }

        return $results;
    }

    private function checkPhpLimits(): array
    {
        $checks = [
            [
                'setting' => 'upload_max_filesize',
                'current' => ini_get('upload_max_filesize'),
                'minimum_bytes' => 50 * 1024 * 1024, // 50M
                'description' => 'Maximum upload file size',
            ],
            [
                'setting' => 'post_max_size',
                'current' => ini_get('post_max_size'),
                'minimum_bytes' => 50 * 1024 * 1024,
                'description' => 'Maximum POST body size',
            ],
            [
                'setting' => 'memory_limit',
                'current' => ini_get('memory_limit'),
                'minimum_bytes' => 128 * 1024 * 1024,
                'description' => 'PHP memory limit',
            ],
            [
                'setting' => 'max_execution_time',
                'current' => ini_get('max_execution_time'),
                'minimum_bytes' => 120, // seconds, not bytes
                'description' => 'Max script execution time (seconds)',
            ],
        ];

        $results = [];
        foreach ($checks as $check) {
            $currentBytes = $this->parsePhpSize($check['current']);
            $results[] = [
                'setting' => $check['setting'],
                'current' => $check['current'],
                'current_bytes' => $currentBytes,
                'minimum_bytes' => $check['minimum_bytes'],
                'ok' => $currentBytes >= $check['minimum_bytes'],
                'description' => $check['description'],
            ];
        }

        return $results;
    }

    private function checkStorage(): array
    {
        $directories = [
            'storage/app/public/clips' => 'Video clip storage',
            'storage/app/public/subclips' => 'Subclip storage',
            'storage/app/public/thumbnails' => 'Thumbnail storage',
            'storage/app/public/captions' => 'Caption file storage',
            'storage/logs' => 'Application logs',
            'bootstrap/cache' => 'Framework cache',
        ];

        $results = [];
        foreach ($directories as $dir => $purpose) {
            $fullPath = base_path($dir);
            $results[] = [
                'path' => $dir,
                'exists' => is_dir($fullPath),
                'writable' => is_dir($fullPath) && is_writable($fullPath),
                'purpose' => $purpose,
            ];
        }

        return $results;
    }

    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            return [
                'connected' => true,
                'driver' => config('database.default'),
                'database' => config('database.connections.' . config('database.default') . '.database'),
            ];
        } catch (\Exception $e) {
            return [
                'connected' => false,
                'driver' => config('database.default'),
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Convert PHP shorthand size notation (e.g. "64M") to bytes.
     */
    private function parsePhpSize(string $value): int
    {
        $value = trim($value);
        $unit = strtolower(substr($value, -1));
        $number = (int) $value;

        switch ($unit) {
            case 'g':
                $number *= 1024 * 1024 * 1024;
                break;
            case 'm':
                $number *= 1024 * 1024;
                break;
            case 'k':
                $number *= 1024;
                break;
        }

        return $number;
    }
}
