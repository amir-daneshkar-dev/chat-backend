<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Agent;
use App\Services\ChatService;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    protected $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    /**
     * Get all chats for agent dashboard.
     */
    public function getChats(Request $request)
    {
        $user = $request->user();
        
        if (!$user->isAgent()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get all chats (assigned to agent + waiting)
        $chats = Chat::with(['user', 'agent', 'messages', 'latestMessage'])
                    ->where(function ($query) use ($user) {
                        $query->where('agent_id', $user->id)
                              ->orWhere('status', 'waiting');
                    })
                    ->orderByRaw("CASE WHEN status = 'waiting' THEN 1 WHEN status = 'active' THEN 2 ELSE 3 END")
                    ->orderBy('queue_position')
                    ->orderBy('updated_at', 'desc')
                    ->get();

        return response()->json($chats->map(function ($chat) {
            return $this->formatChatResponse($chat);
        }));
    }

    /**
     * Assign a chat to the current agent.
     */
    public function assignChat(Request $request, $chatId)
    {
        $user = $request->user();
        
        if (!$user->isAgent()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $chat = Chat::where('uuid', $chatId)->firstOrFail();

        if ($chat->status !== 'waiting') {
            return response()->json(['message' => 'Chat is not available for assignment'], 422);
        }

        // Check if agent can accept new chats
        if (!$user->agent->canAcceptNewChat()) {
            return response()->json(['message' => 'Agent cannot accept new chats'], 422);
        }

        $this->chatService->assignChatToAgent($chat, $user);

        return response()->json($this->formatChatResponse($chat->fresh()));
    }

    /**
     * Update agent status.
     */
    public function updateStatus(Request $request)
    {
        $request->validate([
            'status' => 'required|in:available,busy,offline',
        ]);

        $user = $request->user();
        
        if (!$user->isAgent()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user->agent->updateStatus($request->status);

        return response()->json([
            'status' => $request->status,
            'message' => 'Status updated successfully',
        ]);
    }

    /**
     * Get agent statistics.
     */
    public function getStats(Request $request)
    {
        $user = $request->user();
        
        if (!$user->isAgent()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $stats = [
            'activeChats' => Chat::where('agent_id', $user->id)
                                ->where('status', 'active')
                                ->count(),
            'totalChats' => Chat::where('agent_id', $user->id)->count(),
            'waitingChats' => Chat::where('status', 'waiting')->count(),
            'closedToday' => Chat::where('agent_id', $user->id)
                               ->where('status', 'closed')
                               ->whereDate('ended_at', today())
                               ->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Close a chat.
     */
    public function closeChat(Request $request, $chatId)
    {
        $user = $request->user();
        
        if (!$user->isAgent()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $chat = Chat::where('uuid', $chatId)->firstOrFail();

        if ($chat->agent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $chat->close();

        return response()->json([
            'message' => 'Chat closed successfully',
            'chat' => $this->formatChatResponse($chat->fresh()),
        ]);
    }

    /**
     * Format chat response.
     */
    private function formatChatResponse(Chat $chat): array
    {
        return [
            'id' => $chat->uuid,
            'user' => [
                'id' => $chat->user->id,
                'name' => $chat->user->name,
                'email' => $chat->user->email,
                'avatar' => $chat->user->avatar,
                'isOnline' => $chat->user->is_online,
            ],
            'agent' => $chat->agent ? [
                'id' => $chat->agent->id,
                'name' => $chat->agent->name,
                'email' => $chat->agent->email,
                'avatar' => $chat->agent->avatar,
                'isOnline' => $chat->agent->is_online,
                'status' => $chat->agent->agent->status ?? 'offline',
            ] : null,
            'messages' => $chat->messages->map(function ($message) {
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
            }),
            'status' => $chat->status,
            'queuePosition' => $chat->queue_position,
            'createdAt' => $chat->created_at,
            'updatedAt' => $chat->updated_at,
            'unreadCount' => $chat->unread_count,
        ];
    }
}