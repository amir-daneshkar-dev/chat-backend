<?php

namespace App\Models\Relations;

use App\Models\Chat;
use App\Models\User;

trait TypingStatusRelationsTrait
{
    /**
     * Get the chat that owns the typing status.
     */
    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    /**
     * Get the user that owns the typing status.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
