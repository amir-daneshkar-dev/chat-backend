<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use App\Events\MessageSent;
use App\Services\MessageService;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    protected $messageService;

    public function __construct(MessageService $messageService)
    {
        $this->messageService = $messageService;
    }

    /**
     * Send a message in a chat.
     */
    public function store(Request $request, $chatId)
    {
        $request->validate([
            'content' => 'required|string',
            'type' => 'sometimes|in:text,file,image,voice,system',
            'file_url' => 'sometimes|url',
            'file_name' => 'sometimes|string',
            'file_size' => 'sometimes|integer',
            'voice_duration' => 'sometimes|integer',
        ]);

        $chat = Chat::where('uuid', $chatId)->firstOrFail();
        $user = $request->user();

        // Check if user has access to this chat
        if (!$this->userCanAccessChat($user, $chat)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $message = $this->messageService->createMessage($chat, $user, [
            'content' => $request->content,
            'type' => $request->type ?? 'text',
            'file_url' => $request->file_url,
            'file_name' => $request->file_name,
            'file_size' => $request->file_size,
            'voice_duration' => $request->voice_duration,
        ]);

        broadcast(new MessageSent($message))->toOthers();

        return response()->json($this->formatMessageResponse($message), 201);
    }

    /**
     * Mark a message as read.
     */
    public function markAsRead(Request $request, $messageId)
    {
        $message = Message::where('uuid', $messageId)->firstOrFail();
        $user = $request->user();

        // Check if user has access to this message
        if (!$this->userCanAccessChat($user, $message->chat)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $message->markAsRead();

        return response()->json(['message' => 'Message marked as read']);
    }

    /**
     * Get messages for a chat.
     */
    public function index(Request $request, $chatId)
    {
        $chat = Chat::where('uuid', $chatId)->firstOrFail();
        $user = $request->user();

        // Check if user has access to this chat
        if (!$this->userCanAccessChat($user, $chat)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $messages = Message::with('user')
                          ->where('chat_id', $chat->id)
                          ->orderBy('created_at')
                          ->paginate(50);

        return response()->json([
            'data' => $messages->items(),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    /**
     * Check if user can access the chat.
     */
    private function userCanAccessChat($user, Chat $chat): bool
    {
        return $user->isAgent() || $chat->user_id === $user->id;
    }

    /**
     * Format message response.
     */
    private function formatMessageResponse(Message $message): array
    {
        return [
            'id' => $message->uuid,
            'chatId' => $message->chat->uuid,
            'userId' => $message->user_id,
            'content' => $message->content,
            'type' => $message->type,
            'timestamp' => $message->created_at,
            'isRead' => $message->is_read,
            'isAgent' => $message->is_agent,
            'fileUrl' => $message->file_url,
            'fileName' => $message->file_name,
            'fileSize' => $message->file_size,
            'voiceDuration' => $message->voice_duration,
        ];
    }
}