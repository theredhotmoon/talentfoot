<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * Keys exposed via the public API, with their defaults and allowed range.
     */
    private const SCHEMA = [
        'max_active_challenges' => ['default' => 9,  'min' => 1, 'max' => 50],
        'dashboard_clips_count' => ['default' => 6,  'min' => 1, 'max' => 20],
        'per_page_count'        => ['default' => 9,  'min' => 3, 'max' => 30],
    ];

    /**
     * GET /api/settings — public, used by the frontend on every page load.
     */
    public function index()
    {
        $result = [];

        foreach (self::SCHEMA as $key => $meta) {
            $result[$key] = Setting::get($key, $meta['default']);
        }

        return response()->json($result);
    }

    /**
     * PUT /api/admin/settings — admin-only, persists one or more settings.
     */
    public function update(Request $request)
    {
        // Build dynamic validation rules from the schema
        $rules = [];
        foreach (self::SCHEMA as $key => $meta) {
            $rules[$key] = ['sometimes', 'integer', "min:{$meta['min']}", "max:{$meta['max']}"];
        }

        $validated = $request->validate($rules);

        foreach ($validated as $key => $value) {
            Setting::set($key, $value);
        }

        // Return the full updated state
        return $this->index();
    }
}
