<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Chat channel authorization
Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    // Check if user is an agent or the chat owner
    $chat = \App\Models\Chat::where('uuid', $chatId)->first();

    if (!$chat) {
        return false;
    }

    // Agents can access any chat
    if ($user->isAgent()) {
        return true;
    }

    // Users can only access their own chats
    return $chat->user_id === $user->id;
});

// Agent dashboard channel authorization
Broadcast::channel('agent.dashboard', function ($user) {
    // Only agents can access the agent dashboard
    return $user->isAgent();
});
