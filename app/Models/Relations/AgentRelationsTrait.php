<?php

namespace App\Models\Relations;

use App\Models\User;

trait AgentRelationsTrait
{
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
}
