<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Chat extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'uuid',
        'user_id',
        'agent_id',
        'status',
        'queue_position',
        'started_at',
        'ended_at',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'metadata' => 'array',
        'queue_position' => 'integer',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($chat) {
            if (empty($chat->uuid)) {
                $chat->uuid = Str::uuid();
            }
        });
    }

    /**
     * Get the user that owns the chat.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the agent assigned to the chat.
     */
    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    /**
     * Get the messages for the chat.
     */
    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    /**
     * Get the latest message for the chat.
     */
    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * Get unread messages count for the chat.
     */
    public function getUnreadCountAttribute()
    {
        return $this->messages()->where('is_read', false)->count();
    }

    /**
     * Assign an agent to the chat.
     */
    public function assignAgent(User $agent): void
    {
        $this->update([
            'agent_id' => $agent->id,
            'status' => 'active',
            'started_at' => now(),
            'queue_position' => null,
        ]);

        // Increment agent's active chats
        if ($agent->agent) {
            $agent->agent->incrementActiveChats();
        }
    }

    /**
     * Close the chat.
     */
    public function close(): void
    {
        $this->update([
            'status' => 'closed',
            'ended_at' => now(),
        ]);

        // Decrement agent's active chats
        if ($this->agent && $this->agent->agent) {
            $this->agent->agent->decrementActiveChats();
        }
    }

    /**
     * Update queue position.
     */
    public function updateQueuePosition(int $position): void
    {
        $this->update(['queue_position' => $position]);
    }

    /**
     * Scope for waiting chats.
     */
    public function scopeWaiting($query)
    {
        return $query->where('status', 'waiting');
    }

    /**
     * Scope for active chats.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for closed chats.
     */
    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }
}