<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.' . $this->message->chat->uuid),
            new PrivateChannel('agent.dashboard'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'MessageSent';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'message' => [
                'id' => $this->message->uuid,
                'chatId' => $this->message->chat->uuid,
                'userId' => $this->message->user_id,
                'content' => $this->message->content,
                'type' => $this->message->type,
                'timestamp' => $this->message->created_at,
                'isRead' => $this->message->is_read,
                'isAgent' => $this->message->is_agent,
                'file_url' => $this->message->file_url,
                'file_name' => $this->message->file_name,
                'file_size' => $this->message->file_size,
                'voice_duration' => $this->message->voice_duration,
            ],
        ];
    }
}
