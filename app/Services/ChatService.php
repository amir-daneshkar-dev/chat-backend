<?php

namespace App\Services;

use App\Models\Chat;
use App\Models\User;
use App\Models\Message;
use App\Events\ChatCreated;
use App\Events\AgentJoined;

class ChatService
{
    /**
     * Create a new chat.
     */
    public function createChat(User $user): Chat
    {
        // Get queue position
        $queuePosition = Chat::waiting()->count() + 1;

        $chat = Chat::create([
            'user_id' => $user->id,
            'status' => 'waiting',
            'queue_position' => $queuePosition,
        ]);

        // Create welcome message
        $this->createSystemMessage($chat, 'Welcome to support! You are #' . $queuePosition . ' in the queue.');

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
        $this->createSystemMessage($chat, $agent->name . ' has joined the chat');

        // Broadcast agent joined event
        broadcast(new AgentJoined($chat, $agent))->toOthers();
    }

    /**
     * Update queue positions for waiting chats.
     */
    public function updateQueuePositions(): void
    {
        $waitingChats = Chat::waiting()
            ->orderBy('created_at')
            ->get();

        foreach ($waitingChats as $index => $chat) {
            $chat->updateQueuePosition($index + 1);
        }
    }

    /**
     * Find available agent for chat assignment.
     */
    public function findAvailableAgent(): ?User
    {
        return User::whereHas('agent', function ($query) {
            $query->where('status', 'available');
        })
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
    public function autoAssignChats(): void
    {
        $waitingChats = Chat::waiting()
            ->orderBy('created_at')
            ->get();

        foreach ($waitingChats as $chat) {
            $agent = $this->findAvailableAgent();

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
            'type' => 'system',
            'is_read' => false,
        ]);
    }
}
