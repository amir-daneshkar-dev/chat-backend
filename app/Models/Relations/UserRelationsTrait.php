<?php

namespace App\Models\Relations;

use App\Models\Agent;
use App\Models\Chat;
use App\Models\Message;

trait UserRelationsTrait
{
    public function agent()
    {
        return $this->hasOne(Agent::class);
    }

    public function chats()
    {
        return $this->hasMany(Chat::class);
    }

    public function agentChats()
    {
        return $this->hasMany(Chat::class, 'agent_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
