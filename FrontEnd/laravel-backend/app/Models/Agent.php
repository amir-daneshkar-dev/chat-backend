<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Agent extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'status',
        'active_chats',
        'max_chats',
        'skills',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'skills' => 'array',
        'active_chats' => 'integer',
        'max_chats' => 'integer',
    ];

    /**
     * Get the user that owns the agent profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the chats assigned to this agent.
     */
    public function chats()
    {
        return $this->hasMany(Chat::class, 'agent_id', 'user_id');
    }

    /**
     * Check if agent can accept new chats.
     */
    public function canAcceptNewChat(): bool
    {
        return $this->status === 'available' && $this->active_chats < $this->max_chats;
    }

    /**
     * Update agent status.
     */
    public function updateStatus(string $status): void
    {
        $this->update(['status' => $status]);
    }

    /**
     * Increment active chats count.
     */
    public function incrementActiveChats(): void
    {
        $this->increment('active_chats');
    }

    /**
     * Decrement active chats count.
     */
    public function decrementActiveChats(): void
    {
        $this->decrement('active_chats');
    }
}