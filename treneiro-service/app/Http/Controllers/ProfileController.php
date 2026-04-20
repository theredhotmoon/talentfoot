<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /**
     * Update the authenticated user's profile (name & email).
     * Role is NOT editable here — only admins can change roles.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->update($validated);

        return response()->json($user->fresh());
    }

    /**
     * Change the authenticated user's password.
     * Requires current password verification.
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    /**
     * Toggle show_tips preference for the authenticated user.
     */
    public function updateTips(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'show_tips' => 'required|boolean',
        ]);

        $user->update(['show_tips' => $request->show_tips]);

        return response()->json($user->fresh());
    }

    public function renewSubscription(Request $request)
    {
        $user = $request->user();
        // Set subscription to exactly one month from today for testing
        $user->update(['subscription_valid_until' => now()->addMonth()]);
        
        return response()->json($user->fresh());
    }

    public function cancelSubscription(Request $request)
    {
        $user = $request->user();
        // Invalidate subscription by setting it to a past date
        $user->update(['subscription_valid_until' => now()->subDay()]);
        
        return response()->json($user->fresh());
    }

    /**
     * Update the auto-play delay preference for the authenticated user.
     */
    public function updateAutoPlayDelay(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'auto_play_delay' => 'required|integer|min:3|max:30',
        ]);

        $user->update(['auto_play_delay' => $request->auto_play_delay]);

        return response()->json($user->fresh());
    }
}
