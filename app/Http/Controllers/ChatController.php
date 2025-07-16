<?php

namespace App\Http\Controllers;

use App\Enums\ChatStatus;
use App\Enums\UserRole;
use App\Http\Requests\Chat\CreateChatRequest;
use App\Http\Requests\Chat\UpdateChatRequest;
use App\Models\Chat;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Events\ChatCreated;
use App\Events\ChatUpdated;
use App\Services\ChatService;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    protected $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    /**
     * Get all chats for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $organizationId = $request->attributes->get('organization_id');

        if ($user->isAgent()) {
            // Return chats assigned to this agent within their organization
            $chats = Chat::with(['user', 'agent', 'messages', 'latestMessage'])
                ->forOrganization($organizationId)
                ->where(function ($query) use ($user) {
                    $query->where('agent_id', $user->id)
                        ->orWhere('status', 'waiting');
                })
                ->orderBy('updated_at', 'desc')
                ->get();
        } else {
            // Return chats for this user within their organization
            $chats = Chat::with(['user', 'agent', 'messages', 'latestMessage'])
                ->forOrganization($organizationId)
                ->where('user_id', $user->id)
                ->orderBy('updated_at', 'desc')
                ->get();
        }

        return response()->json($chats->map(function ($chat) {
            return $this->formatChatResponse($chat);
        }));
    }

    /**
     * Create a new chat.
     */
    public function store(CreateChatRequest $request)
    {
        $user = $request->user();

        $organizationId = $request->attributes->get('organization_id');

        // If no user is authenticated, create a guest user
        if (!$user) {
            // Check if user already exists by email within the organization
            $user = User::where('email', $request->email)
                ->where('organization_id', $organizationId)
                ->first();

            if (!$user) {
                // Create new user only if doesn't exist
                $user = User::create([
                    'name' => $request->name ?? 'Guest User',
                    'email' => $request->email ?? 'guest@example.com',
                    'password' => Hash::make('temporary'),
                    'role' => UserRole::USER,
                    'organization_id' => $organizationId,
                ]);
            } else {
                // Update user name if provided and different
                if ($request->name && $user->name !== $request->name) {
                    $user->update(['name' => $request->name]);
                }
            }
        }

        // Generate a token for guest users (expires in 1 hour)
        $token = null;
        if ($user->role === UserRole::USER) { // or check for guest logic
            $token = $user->createToken('guest-token', ['*'], now()->addHour())->plainTextToken;
        }

        // Check if user already has an active or waiting chat within the organization
        $existingChat = Chat::where('user_id', $user->id)
            ->where('organization_id', $organizationId)
            ->whereIn('status', [ChatStatus::WAITING, ChatStatus::ACTIVE])
            ->with(['user', 'agent', 'messages', 'latestMessage'])
            ->first();

        if ($existingChat) {
            return response()->json([
                'chat' => $this->formatChatResponse($existingChat),
                'token' => $token,
            ]);
        }

        $chat = $this->chatService->createChat($user);

        broadcast(new ChatCreated($chat))->toOthers();

        return response()->json([
            'chat' => $this->formatChatResponse($chat),
            'token' => $token,
        ], 201);
    }

    /**
     * Get a specific chat.
     */
    public function show(Request $request, $chatId)
    {
        $organizationId = $request->attributes->get('organization_id');

        $chat = Chat::with(['user', 'agent', 'messages.user'])
            ->where('uuid', $chatId)
            ->where('organization_id', $organizationId)
            ->firstOrFail();

        // Check if user has access to this chat
        $user = $request->user();
        if ($user && !$this->userCanAccessChat($user, $chat)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($this->formatChatResponse($chat));
    }

    /**
     * Update a chat.
     */
    public function update(UpdateChatRequest $request, $chatId)
    {
        $organizationId = $request->attributes->get('organization_id');

        $chat = Chat::where('uuid', $chatId)
            ->where('organization_id', $organizationId)
            ->firstOrFail();

        // Check if user has access to this chat
        $user = $request->user();
        if (!$this->userCanAccessChat($user, $chat)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($request->has('status')) {
            $status = ChatStatus::from($request->status);
            if ($status === ChatStatus::CLOSED) {
                $chat->close();
            } else {
                $chat->update(['status' => $status]);
            }
        }

        broadcast(new ChatUpdated($chat))->toOthers();

        return response()->json($this->formatChatResponse($chat));
    }

    /**
     * Delete a chat.
     */
    public function destroy(Request $request, $chatId)
    {
        $organizationId = $request->attributes->get('organization_id');

        $chat = Chat::where('uuid', $chatId)
            ->where('organization_id', $organizationId)
            ->firstOrFail();

        // Check if user has access to this chat
        $user = $request->user();
        if (!$this->userCanAccessChat($user, $chat)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $chat->delete();

        return response()->json(['message' => 'Chat deleted successfully']);
    }

    /**
     * Get chats for a user by email (for guest users).
     */
    public function getUserChats(Request $request, $email)
    {
        $organizationId = $request->attributes->get('organization_id');

        $user = User::where('email', $email)
            ->where('organization_id', $organizationId)
            ->first();

        if (!$user) {
            return response()->json([]);
        }

        $chats = Chat::with(['user', 'agent', 'messages', 'latestMessage'])
            ->where('user_id', $user->id)
            ->where('organization_id', $organizationId)
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($chats->map(function ($chat) {
            return $this->formatChatResponse($chat);
        }));
    }
    /**
     * Check if user can access the chat.
     */
    private function userCanAccessChat(User $user, Chat $chat): bool
    {
        return $user->isAgent() || $chat->user_id === $user->id;
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
