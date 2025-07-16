<?php

namespace App\Models\Relations;

use App\Models\User;
use App\Models\Chat;
use App\Models\Organization;

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

    /**
     * Get the organization that this agent belongs to through their user.
     */
    public function organization()
    {
        return $this->hasOneThrough(Organization::class, User::class, 'id', 'id', 'user_id', 'organization_id');
    }
}
