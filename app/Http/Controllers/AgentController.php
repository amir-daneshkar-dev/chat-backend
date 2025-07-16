<?php

namespace App\Http\Controllers;

use App\Enums\AgentStatus;
use App\Enums\ChatStatus;
use App\Http\Requests\Agent\UpdateAgentStatusRequest;
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
        $organizationId = $request->attributes->get('organization_id');

        if (!$user->isAgent()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get all chats within the organization (assigned to agent + waiting)
        $chats = Chat::with(['user', 'agent', 'messages', 'latestMessage'])
            ->forOrganization($organizationId)
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

        $organizationId = $request->attributes->get('organization_id');

        $chat = Chat::where('uuid', $chatId)
            ->where('organization_id', $organizationId)
            ->firstOrFail();

        if ($chat->status !== ChatStatus::WAITING) {
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
    public function updateStatus(UpdateAgentStatusRequest $request)
    {
        $user = $request->user();

        if (!$user->isAgent()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $status = AgentStatus::from($request->status);
        $user->agent->updateStatus($status);

        return response()->json([
            'status' => $status->value,
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

        $organizationId = $request->attributes->get('organization_id');

        $stats = [
            'activeChats' => Chat::where('agent_id', $user->id)
                ->where('organization_id', $organizationId)
                ->where('status', ChatStatus::ACTIVE)
                ->count(),
            'totalChats' => Chat::where('agent_id', $user->id)
                ->where('organization_id', $organizationId)
                ->count(),
            'waitingChats' => Chat::where('status', ChatStatus::WAITING)
                ->where('organization_id', $organizationId)
                ->count(),
            'closedToday' => Chat::where('agent_id', $user->id)
                ->where('organization_id', $organizationId)
                ->where('status', ChatStatus::CLOSED)
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

        $organizationId = $request->attributes->get('organization_id');

        $chat = Chat::where('uuid', $chatId)
            ->where('organization_id', $organizationId)
            ->firstOrFail();

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
                    'file_url' => $message->file_url,
                    'file_name' => $message->file_name,
                    'file_size' => $message->file_size,
                    'voice_duration' => $message->voice_duration,
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
