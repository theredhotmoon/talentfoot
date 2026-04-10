<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ClipController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SubclipController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ChallengeController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\SettingsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
Route::get('/test', function () {
    return 'Test OK';
});

Route::get('/debug-login', function () {
    try {
        $user = \App\Models\User::where('email', 'admin@admin.com')->first();
        if (!$user) {
            return 'USER NOT FOUND. Count: ' . \App\Models\User::count();
        }
        $check = \Illuminate\Support\Facades\Hash::check('1234', $user->password);
        return 'User: ' . $user->email . ' | Hash check: ' . ($check ? 'PASS' : 'FAIL') . ' | Hash: ' . substr($user->password, 0, 30);
    } catch (\Throwable $e) {
        return 'ERROR: ' . $e->getMessage();
    }
});

Route::get('/test-clip', function () {
    try {
        return \App\Models\Clip::all();
    } catch (\Throwable $e) {
        return $e->getMessage();
    }
});

Route::get('/clips', [ClipController::class, 'index']);
Route::get('/clips/{clip}', [ClipController::class, 'show']);
Route::get('/tags', [TagController::class, 'index']);
Route::get('/tags/{tag}', [TagController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);
Route::get('/stats', [StatsController::class, 'index']);
Route::post('/contact', [ContactController::class, 'store']);
Route::get('/health/dependencies', [HealthController::class, 'dependencies']);

// Public settings (read-only) — used by the frontend on every page load
Route::get('/settings', [SettingsController::class, 'index']);

// Comments can be read by anyone (guests see them on ClipDetail)
Route::get('/clips/{clip}/comments', [CommentController::class, 'index']);

// Temporary debug endpoint — remove once thumbnails are confirmed working
Route::get('/debug-storage', function () {
    $symlinkPath = public_path('storage');
    $symlinkTarget = is_link($symlinkPath) ? readlink($symlinkPath) : null;
    $symlinkExists = file_exists($symlinkPath);

    $thumbnailDir = storage_path('app/public/thumbnails');
    $thumbnailFiles = [];
    if (is_dir($thumbnailDir)) {
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($thumbnailDir, \RecursiveDirectoryIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            $thumbnailFiles[] = [
                'path' => str_replace(storage_path('app/public/'), '', $file->getPathname()),
                'size' => $file->getSize(),
                'readable' => is_readable($file->getPathname()),
            ];
        }
    }

    // Check a few clips from DB
    $clips = \App\Models\Clip::whereNotNull('thumbnails')->limit(5)->get(['id', 'thumbnails']);
    $clipThumbnails = $clips->map(function ($clip) {
        $paths = $clip->thumbnails ?? [];
        $checks = [];
        foreach ($paths as $p) {
            $fullPath = storage_path('app/public/' . $p);
            $checks[] = [
                'db_path' => $p,
                'full_path' => $fullPath,
                'exists' => file_exists($fullPath),
                'readable' => is_readable($fullPath),
                'url' => '/storage/' . $p,
            ];
        }
        return ['clip_id' => $clip->id, 'thumbnails' => $checks];
    });

    return response()->json([
        'symlink' => [
            'path' => $symlinkPath,
            'is_link' => is_link($symlinkPath),
            'target' => $symlinkTarget,
            'target_exists' => $symlinkTarget ? file_exists($symlinkTarget) : false,
            'accessible' => $symlinkExists,
        ],
        'thumbnail_dir' => [
            'path' => $thumbnailDir,
            'exists' => is_dir($thumbnailDir),
            'writable' => is_dir($thumbnailDir) && is_writable($thumbnailDir),
            'file_count' => count($thumbnailFiles),
            'files' => array_slice($thumbnailFiles, 0, 20),
        ],
        'clip_thumbnails_in_db' => $clipThumbnails,
    ]);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::post('/clips/{clip}/rate', [ClipController::class, 'rate']);
    Route::post('/clips/{clip}/comments', [CommentController::class, 'store'])->middleware('throttle:comments');

    // Subclip view tracking & rating (authenticated)
    Route::post('/subclips/{subclip}/view', [SubclipController::class, 'recordView']);
    Route::post('/subclips/{subclip}/rate', [SubclipController::class, 'rate']);

    // Self-service profile management (any authenticated user)
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);
    Route::put('/profile/tips', [ProfileController::class, 'updateTips']);
    Route::post('/profile/subscription/renew', [ProfileController::class, 'renewSubscription']);
    Route::post('/profile/subscription/cancel', [ProfileController::class, 'cancelSubscription']);
    Route::put('/profile/auto-play-delay', [ProfileController::class, 'updateAutoPlayDelay']);

    // Challenges (any authenticated user)
    Route::get('/challenges', [ChallengeController::class, 'index']);
    Route::get('/challenges/active-count', [ChallengeController::class, 'activeCount']);
    Route::post('/challenges', [ChallengeController::class, 'start']);
    Route::post('/challenges/{challenge}/watch', [ChallengeController::class, 'recordWatch']);

    Route::middleware(['auth:sanctum', \App\Http\Middleware\IsAdmin::class])->group(function () {
        Route::post('/clips', [ClipController::class, 'store']);
        Route::put('/clips/{clip}', [ClipController::class, 'update']);
        Route::delete('/clips/{clip}', [ClipController::class, 'destroy']);

        // Subclip CRUD (admin only)
        Route::post('/clips/{clip}/subclips', [SubclipController::class, 'store']);
        Route::post('/clips/{clip}/subclips/reorder', [SubclipController::class, 'reorder']);
        Route::put('/subclips/{subclip}', [SubclipController::class, 'update']);
        Route::delete('/subclips/{subclip}', [SubclipController::class, 'destroy']);

        // Cartoon conversion (admin only)
        Route::post('/clips/{clip}/convert-cartoon', [ClipController::class, 'convertToCartoon']);
        Route::get('/clips/{clip}/cartoon-status', [ClipController::class, 'cartoonStatus']);

        Route::apiResource('tags', \App\Http\Controllers\TagController::class)->only(['store', 'update', 'destroy']);

        Route::apiResource('categories', \App\Http\Controllers\CategoryController::class)->only(['store', 'update', 'destroy']);

        Route::apiResource('users', \App\Http\Controllers\UserController::class);

        // Admin-only settings write
        Route::put('/admin/settings', [SettingsController::class, 'update']);
    });
});
