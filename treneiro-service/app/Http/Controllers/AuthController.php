<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'auth_provider' => 'email',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => [trans('auth.failed')],
            ]);
        }

        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        $data = $user->toArray();
        $data['subscription_active'] = $user->hasActiveSubscription();
        $data['subscription_valid_until'] = $user->subscription_valid_until?->toDateString();
        return response()->json($data);
    }

    /**
     * Redirect user to Google OAuth consent screen.
     */
    public function redirectToGoogle()
    {
        $url = Socialite::driver('google')->stateless()->redirect()->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    /**
     * Handle callback from Google OAuth.
     * Find or create the user, issue a Sanctum token, redirect to frontend.
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/login?error=google_failed');
        }

        // Find by google_id first, then by email
        $user = User::where('google_id', $googleUser->getId())->first();

        if (!$user) {
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                // Link existing account to Google
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'auth_provider' => $user->auth_provider ?: 'google',
                ]);
            } else {
                // Create new user from Google
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'auth_provider' => 'google',
                    'password' => null,
                ]);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        return redirect("{$frontendUrl}/auth/google/callback?token={$token}");
    }
}
