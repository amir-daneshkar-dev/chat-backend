<?php

namespace App\Events;

use App\Models\Chat;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewChatNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;


    public function __construct(public Chat $chat) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('agent.dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'NewChatNotification';
    }

    public function broadcastWith(): array
    {
        return [
            'notification' => [
                'id' => $this->chat->uuid,
                'title' => 'New Chat Request',
                'message' => 'A new chat has been created and is waiting for an agent',
                'userName' => $this->chat->user->name,
                'chatId' => $this->chat->uuid,
                'timestamp' => now(),
                'user' => [
                    'id' => $this->chat->user->id,
                    'name' => $this->chat->user->name,
                    'email' => $this->chat->user->email,
                ],
                'status' => $this->chat->status,
                'queuePosition' => $this->chat->queue_position,
                'createdAt' => $this->chat->created_at,
            ],
        ];
    }
}
