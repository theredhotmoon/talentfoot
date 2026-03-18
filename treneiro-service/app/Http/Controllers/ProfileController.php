<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

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
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

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
}
