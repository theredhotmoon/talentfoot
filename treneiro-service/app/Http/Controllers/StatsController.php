<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Clip;
use App\Models\Challenge;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function index()
    {
        return response()->json([
            'users_count' => User::count(),
            'active_subscriptions' => User::where('subscription_active', true)->count(),
            'clips_count' => Clip::count(),
            'clips_with_subclips' => Clip::has('subclips')->count(),
            'total_subclips' => DB::table('subclips')->count(),
            'challenges_started' => Challenge::count(),
            'challenges_completed' => Challenge::whereNotNull('finished_at')->count(),
            'users_with_challenges' => Challenge::distinct('user_id')->count('user_id'),
        ]);
    }
}
