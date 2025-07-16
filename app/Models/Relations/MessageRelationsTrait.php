<?php

namespace App\Models\Relations;

use App\Models\Chat;
use App\Models\User;
use App\Models\Organization;

trait MessageRelationsTrait
{
    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
