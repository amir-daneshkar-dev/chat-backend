<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UserTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $typingData;

    /**
     * Create a new event instance.
     */
    public function __construct(array $typingData)
    {
        Log::info('UserTyping: Event created', $typingData);
        $this->typingData = $typingData;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channel = 'chat.' . $this->typingData['chatId'];
        Log::info('UserTyping: Broadcasting on channel', ['channel' => $channel]);
        return [
            new PrivateChannel($channel),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        Log::info('UserTyping: Broadcast name', ['name' => 'UserTyping']);
        return 'UserTyping';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        Log::info('UserTyping: Broadcasting data', $this->typingData);
        return $this->typingData;
    }
}
