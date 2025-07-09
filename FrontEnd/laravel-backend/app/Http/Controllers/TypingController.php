<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\TypingStatus;
use App\Events\UserTyping;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TypingController extends Controller
{
    /**
     * Update typing status for a chat.
     */
    public function updateTypingStatus(Request $request, $chatId)
    {
        Log::info('TypingController: updateTypingStatus called', [
            'chatId' => $chatId,
            'request' => $request->all()
        ]);

        $request->validate([
            'isTyping' => 'required|boolean',
        ]);

        $chat = Chat::where('uuid', $chatId)->firstOrFail();
        $user = $request->user();

        Log::info('TypingController: Found chat and user', [
            'chatId' => $chat->id,
            'userId' => $user->id,
            'userName' => $user->name
        ]);

        // Check if user has access to this chat
        if (!$this->userCanAccessChat($user, $chat)) {
            Log::warning('TypingController: User not authorized for chat', [
                'userId' => $user->id,
                'chatId' => $chat->id
            ]);
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $isTyping = $request->boolean('isTyping');
        $expiresAt = now()->addSeconds(5); // Typing status expires in 5 seconds

        Log::info('TypingController: Updating typing status', [
            'isTyping' => $isTyping,
            'expiresAt' => $expiresAt
        ]);

        // Update or create typing status
        TypingStatus::updateOrCreate(
            [
                'chat_id' => $chat->id,
                'user_id' => $user->id,
            ],
            [
                'is_typing' => $isTyping,
                'expires_at' => $expiresAt,
            ]
        );

        // Broadcast typing status
        $typingData = [
            'chatId' => $chat->uuid,
            'userId' => $user->id,
            'userName' => $user->name,
            'isTyping' => $isTyping,
            'timestamp' => now(),
        ];

        Log::info('TypingController: Broadcasting UserTyping event', $typingData);

        broadcast(new UserTyping($typingData))->toOthers();

        Log::info('TypingController: UserTyping event broadcasted successfully');

        return response()->json(['success' => true]);
    }

    /**
     * Get typing statuses for a chat.
     */
    public function getTypingStatuses(Request $request, $chatId)
    {
        $chat = Chat::where('uuid', $chatId)->firstOrFail();
        $user = $request->user();

        // Check if user has access to this chat
        if (!$this->userCanAccessChat($user, $chat)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $typingStatuses = TypingStatus::with('user')
            ->where('chat_id', $chat->id)
            ->where('user_id', '!=', $user->id) // Exclude current user
            ->active()
            ->get();

        return response()->json($typingStatuses->map(function ($status) use ($chat) {
            return [
                'chatId' => $chat->uuid,
                'userId' => $status->user_id,
                'userName' => $status->user->name,
                'isTyping' => $status->is_typing,
                'timestamp' => $status->updated_at,
            ];
        }));
    }

    /**
     * Clean up expired typing statuses.
     */
    public function cleanupExpired()
    {
        $deleted = TypingStatus::expired()->delete();

        return response()->json([
            'message' => "Cleaned up {$deleted} expired typing statuses",
        ]);
    }

    /**
     * Check if user can access the chat.
     */
    private function userCanAccessChat($user, Chat $chat): bool
    {
        return $user->isAgent() || $chat->user_id === $user->id;
    }
}
