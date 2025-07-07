<?php

namespace App\Models\Relations;

use App\Models\User;

trait ChatRelationsTrait
{
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
}
