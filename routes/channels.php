<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Chat;
use App\Models\User;

// User-specific channels
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Chat-specific channels
Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    $chat = Chat::where('uuid', $chatId)->first();

    if (!$chat) {
        return false;
    }

    // Allow access if user is the chat owner or an agent
    return $user->isAgent() || $chat->user_id === $user->id;
});

// Agent dashboard channel
Broadcast::channel('agent.dashboard', function ($user) {
    // Only agents can access the agent dashboard
    return $user->isAgent();
});
