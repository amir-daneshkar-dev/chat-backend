<?php

namespace App\Models\Relations;

use App\Models\Agent;

trait UserRelationsTrait
{
    /**
     * Get the agent profile for this user.
     */
    public function agent()
    {
        return $this->hasOne(Agent::class);
    }

    /**
     * Get the chats where this user is the customer.
     */
    public function chats()
    {
        return $this->hasMany(Chat::class);
    }

    /**
     * Get the chats where this user is the agent.
     */
    public function agentChats()
    {
        return $this->hasMany(Chat::class, 'agent_id');
    }

    /**
     * Get the messages sent by this user.
     */
    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
