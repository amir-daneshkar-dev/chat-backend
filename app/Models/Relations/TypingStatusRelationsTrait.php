<?php

namespace App\Models\Relations;

use App\Models\Chat;
use App\Models\User;

trait TypingStatusRelationsTrait
{
    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
