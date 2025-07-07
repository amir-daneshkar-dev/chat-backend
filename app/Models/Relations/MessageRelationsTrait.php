<?php

namespace App\Models\Relations;

use App\Models\Chat;
use App\Models\User;

trait MessageRelationsTrait
{

    /**
     * Get the chat that owns the message.
     */
    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    /**
     * Get the user that sent the message.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
