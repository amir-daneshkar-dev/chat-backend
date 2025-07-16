<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Models\Agent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login user and return token.
     */
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Update online status
        $user->updateOnlineStatus(true);

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        // Load agent relationship if user is an agent
        $user->load('agent');

        return response()->json([
            'token' => $token,
            'user' => $this->formatUserResponse($user),
            'type' => $user->isAgent() ? 'agent' : 'user',
        ]);
    }

    /**
     * Logout user.
     */
    public function logout(Request $request)
    {
        // Update online status
        $request->user()->updateOnlineStatus(false);

        // Revoke token
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Get authenticated user.
     */
    public function user(Request $request)
    {
        $user = $request->user();
        $user->load('agent');

        return response()->json([
            'user' => $this->formatUserResponse($user),
        ]);
    }

    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'user',
        ]);

        // Create agent profile if role is agent
        if ($user->role === 'agent') {
            Agent::create([
                'user_id' => $user->id,
                'status' => 'offline',
                'max_chats' => 5,
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;
        $user->load('agent');

        return response()->json([
            'token' => $token,
            'user' => $this->formatUserResponse($user),
            'type' => $user->isAgent() ? 'agent' : 'user',
        ], 201);
    }

    /**
     * Format user response.
     */
    private function formatUserResponse(User $user): array
    {
        $response = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'isOnline' => $user->is_online,
            'role' => $user->role,
        ];

        if ($user->isAgent() && $user->agent) {
            $response['status'] = $user->agent->status;
            $response['activeChats'] = $user->agent->active_chats;
            $response['maxChats'] = $user->agent->max_chats;
        }

        return $response;
    }
}
