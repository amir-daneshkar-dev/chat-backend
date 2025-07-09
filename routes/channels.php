<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Chat;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

// User-specific channels
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {

    Log::info('User channel accessed', ['user_id' => $user->id, 'requested_id' => $id]);
    return (int) $user->id === (int) $id;
    // return true;
});

// Chat-specific channels
Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    Log::info('chat channel accessed', ['user_id' => $user->id, 'requested_id' => $chatId]);

    return true;

    $chat = Chat::where('uuid', $chatId)->first();

    if (!$chat) {
        return false;
    }

    // Allow access if user is the chat owner or an agent
    return $user->isAgent() || $chat->user_id === $user->id;
});

// Agent dashboard channel
Broadcast::channel('agent.dashboard', function ($user) {
    Log::info('agent dashboard channel accessed', ['user_id' => $user->id]);

    // Only agents can access the agent dashboard
    return $user->isAgent();
});
