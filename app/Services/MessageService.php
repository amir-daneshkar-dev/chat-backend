<?php

namespace App\Services;

use App\Models\Chat;
use App\Models\User;
use App\Models\Message;

class MessageService
{
    /**
     * Create a new message.
     */
    public function createMessage(Chat $chat, User $user, array $data): Message
    {
        $message = Message::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'content' => $data['content'],
            'type' => $data['type'] ?? 'text',
            'file_url' => $data['file_url'] ?? null,
            'file_name' => $data['file_name'] ?? null,
            'file_size' => $data['file_size'] ?? null,
            'voice_duration' => $data['voice_duration'] ?? null,
            'is_read' => false,
        ]);

        // Update chat's updated_at timestamp
        $chat->touch();

        return $message;
    }

    /**
     * Mark messages as read.
     */
    public function markMessagesAsRead(Chat $chat, User $user): int
    {
        return Message::where('chat_id', $chat->id)
            ->where('user_id', '!=', $user->id) // Don't mark own messages as read
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Get unread message count for a chat.
     */
    public function getUnreadCount(Chat $chat, User $user): int
    {
        return Message::where('chat_id', $chat->id)
            ->where('user_id', '!=', $user->id)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Get messages for a chat with pagination.
     */
    public function getMessages(Chat $chat, int $page = 1, int $perPage = 50): array
    {
        $messages = Message::with('user')
            ->where('chat_id', $chat->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return [
            'messages' => $messages->items(),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
                'has_more' => $messages->hasMorePages(),
            ],
        ];
    }
}
