<?php

namespace App\Models;

use App\Enums\AgentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Relations\AgentRelationsTrait;

class Agent extends Model
{
    use HasFactory, AgentRelationsTrait;

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
        'status' => AgentStatus::class,
    ];

    /**
     * Check if agent can accept new chats.
     */
    public function canAcceptNewChat(): bool
    {
        return $this->status->canAcceptChats() && $this->active_chats < $this->max_chats;
    }

    /**
     * Update agent status.
     */
    public function updateStatus(AgentStatus $status): void
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
