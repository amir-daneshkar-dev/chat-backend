<?php

namespace App\Services;

use App\Enums\AgentStatus;
use App\Enums\ChatStatus;
use App\Enums\MessageType;
use App\Models\Chat;
use App\Models\User;
use App\Models\Message;
use App\Events\ChatCreated;
use App\Events\NewChatNotification;
use App\Events\AgentJoined;
use App\Events\ChatUpdated;
use App\Events\MessageSent;

class ChatService
{
    /**
     * Create a new chat.
     */
    public function createChat(User $user): Chat
    {
        // Get queue position within the organization
        $queuePosition = Chat::waiting()
            ->where('organization_id', $user->organization_id)
            ->count() + 1;

        $chat = Chat::create([
            'user_id' => $user->id,
            'organization_id' => $user->organization_id,
            'status' => ChatStatus::WAITING,
            'queue_position' => $queuePosition,
        ]);

        // Create welcome message
        $welcomeMessage = $this->createSystemMessage($chat, 'Welcome to support! You are #' . $queuePosition . ' in the queue.');

        // Broadcast the welcome message
        broadcast(new MessageSent($welcomeMessage))->toOthers();

        // Broadcast notification to agents
        broadcast(new NewChatNotification($chat))->toOthers();

        return $chat;
    }

    /**
     * Assign a chat to an agent.
     */
    public function assignChatToAgent(Chat $chat, User $agent): void
    {
        if (!$agent->isAgent() || !$agent->agent->canAcceptNewChat()) {
            throw new \Exception('Agent cannot accept new chats');
        }

        $chat->assignAgent($agent);

        // Update queue positions for remaining waiting chats
        $this->updateQueuePositions();

        // Create system message
        $joinMessage = $this->createSystemMessage($chat, $agent->name . ' has joined the chat');

        // Broadcast the join message
        broadcast(new MessageSent($joinMessage))->toOthers();

        // Broadcast agent joined event
        broadcast(new AgentJoined($chat, $agent))->toOthers();

        // Broadcast chat updated event to notify other agents
        broadcast(new ChatUpdated($chat))->toOthers();
    }

    /**
     * Update queue positions for waiting chats.
     */
    public function updateQueuePositions(?int $organizationId = null): void
    {
        $query = Chat::waiting()->orderBy('created_at');

        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        $waitingChats = $query->get();

        foreach ($waitingChats as $index => $chat) {
            $chat->updateQueuePosition($index + 1);
        }
    }

    /**
     * Find available agent for chat assignment.
     */
    public function findAvailableAgent(int $organizationId): ?User
    {
        return User::whereHas('agent', function ($query) {
            $query->where('status', AgentStatus::AVAILABLE);
        })
            ->where('organization_id', $organizationId)
            ->with('agent')
            ->get()
            ->filter(function ($user) {
                return $user->agent->canAcceptNewChat();
            })
            ->sortBy('agent.active_chats')
            ->first();
    }

    /**
     * Auto-assign waiting chats to available agents.
     */
    public function autoAssignChats(?int $organizationId = null): void
    {
        $query = Chat::waiting()->orderBy('created_at');

        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        $waitingChats = $query->get();

        foreach ($waitingChats as $chat) {
            $agent = $this->findAvailableAgent($organizationId ?? $chat->organization_id);

            if ($agent) {
                $this->assignChatToAgent($chat, $agent);
            } else {
                break; // No more available agents
            }
        }
    }

    /**
     * Create a system message.
     */
    private function createSystemMessage(Chat $chat, string $content): Message
    {
        return Message::create([
            'chat_id' => $chat->id,
            'user_id' => $chat->user_id, // Use chat user as sender for system messages
            'content' => $content,
            'type' => MessageType::SYSTEM,
            'is_read' => false,
        ]);
    }
}
