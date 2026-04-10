<?php

namespace App\Http\Controllers;

use App\Models\Challenge;
use App\Models\ChallengeProgress;
use App\Models\Clip;
use App\Models\Setting;
use Illuminate\Http\Request;

class ChallengeController extends Controller
{

    /**
     * List the authenticated user's challenges.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $challenges = Challenge::where('user_id', $user->id)
            ->with([
                'clip' => function ($q) {
                    $q->withCount('subclips');
                },
                'clip.category',
                'progress'
            ])
            ->orderByDesc('started_at')
            ->get()
            ->map(function ($challenge) {
                $clip = $challenge->clip;
                $totalItems = 1 + ($clip->subclips_count ?? $clip->subclips()->count());
                $watchedItems = $challenge->progress->count();

                return [
                    'id' => $challenge->id,
                    'clip_id' => $challenge->clip_id,
                    'clip_name' => $clip->getTranslations('name'),
                    'clip_slug' => $clip->getTranslations('slug'),
                    'clip_thumbnail' => $clip->thumbnails[0] ?? null,
                    'category' => $clip->category ? [
                        'id' => $clip->category->id,
                        'name' => $clip->category->getTranslations('name'),
                    ] : null,
                    'started_at' => $challenge->started_at->toISOString(),
                    'finished_at' => $challenge->finished_at?->toISOString(),
                    'is_completed' => $challenge->isCompleted(),
                    'total_items' => $totalItems,
                    'watched_items' => $watchedItems,
                    'duration' => $challenge->durationForHumans(),
                ];
            });

        return response()->json($challenges);
    }

    /**
     * Start a challenge for a given clip.
     */
    /**
     * Get count of active (unfinished) challenges for the authenticated user.
     */
    public function activeCount(Request $request)
    {
        $user = $request->user();
        $count = Challenge::where('user_id', $user->id)
            ->whereNull('finished_at')
            ->count();

        $maxAllowed = Setting::get('max_active_challenges', 9);

        return response()->json([
            'active_count' => $count,
            'max_allowed'  => $maxAllowed,
        ]);
    }

    /**
     * Start a challenge for a given clip.
     */
    public function start(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'clip_id' => 'required|exists:clips,id',
            'main_clip_pre_watched' => 'sometimes|boolean',
        ]);

        // Check subscription
        if (!$user->hasActiveSubscription()) {
            return response()->json([
                'error' => 'active_subscription_required',
                'message' => 'You need an active subscription to start a challenge.',
            ], 403);
        }

        // Check if challenge already exists
        $existing = Challenge::where('user_id', $user->id)
            ->where('clip_id', $request->clip_id)
            ->first();

        if ($existing) {
            if ($existing->isCompleted()) {
                return response()->json([
                    'error' => 'challenge_already_completed',
                    'message' => 'You have already completed this challenge.',
                    'challenge' => $this->formatChallenge($existing),
                ], 409);
            }
            // Return existing in-progress challenge
            return response()->json([
                'challenge' => $this->formatChallenge($existing),
            ]);
        }

        // Check active challenge limit
        $maxAllowed = Setting::get('max_active_challenges', 9);
        $activeCount = Challenge::where('user_id', $user->id)
            ->whereNull('finished_at')
            ->count();

        if ($activeCount >= $maxAllowed) {
            return response()->json([
                'error'        => 'challenge_limit_reached',
                'message'      => 'You can have up to ' . $maxAllowed . ' active challenges. Complete some to start new ones.',
                'active_count' => $activeCount,
                'max_allowed'  => $maxAllowed,
            ], 429);
        }

        // Create new challenge
        $challenge = Challenge::create([
            'user_id' => $user->id,
            'clip_id' => $request->clip_id,
            'started_at' => now(),
        ]);

        // If the user already watched the main clip preview, mark it as watched immediately
        if ($request->boolean('main_clip_pre_watched')) {
            ChallengeProgress::updateOrCreate(
                [
                    'challenge_id' => $challenge->id,
                    'watchable_type' => 'clip',
                    'watchable_id' => $request->clip_id,
                ],
                ['watched_at' => now()]
            );
        }

        return response()->json([
            'challenge' => $this->formatChallenge($challenge),
        ], 201);
    }

    /**
     * Record that a user watched a video (clip or subclip).
     */
    public function recordWatch(Request $request, Challenge $challenge)
    {
        $user = $request->user();

        // Ensure user owns this challenge
        if ((int) $challenge->user_id !== (int) $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Already completed
        if ($challenge->isCompleted()) {
            return response()->json([
                'challenge' => $this->formatChallenge($challenge),
                'message' => 'Challenge already completed.',
            ]);
        }

        $request->validate([
            'watchable_type' => 'required|in:clip,subclip',
            'watchable_id' => 'required|string',
        ]);

        // Upsert progress entry
        ChallengeProgress::updateOrCreate(
            [
                'challenge_id' => $challenge->id,
                'watchable_type' => $request->watchable_type,
                'watchable_id' => $request->watchable_id,
            ],
            [
                'watched_at' => now(),
            ]
        );

        // Check completion: main clip + all subclips
        $clip = $challenge->clip;
        $totalItems = 1 + $clip->subclips()->count();
        $watchedItems = $challenge->progress()->count();

        if ($watchedItems >= $totalItems) {
            $challenge->update(['finished_at' => now()]);
            $challenge->refresh();
        }

        return response()->json([
            'challenge' => $this->formatChallenge($challenge),
        ]);
    }

    /**
     * Format a challenge for JSON response.
     */
    private function formatChallenge(Challenge $challenge): array
    {
        $challenge->load('progress', 'clip');
        $clip = $challenge->clip;
        $totalItems = 1 + $clip->subclips()->count();

        return [
            'id' => $challenge->id,
            'clip_id' => $challenge->clip_id,
            'started_at' => $challenge->started_at->toISOString(),
            'finished_at' => $challenge->finished_at?->toISOString(),
            'is_completed' => $challenge->isCompleted(),
            'total_items' => $totalItems,
            'watched_items' => $challenge->progress->count(),
            'watched_ids' => $challenge->progress->pluck('watchable_id')->toArray(),
            'duration' => $challenge->durationForHumans(),
        ];
    }
}
