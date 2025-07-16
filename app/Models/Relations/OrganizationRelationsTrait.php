<?php

namespace App\Models\Relations;

use App\Models\User;
use App\Models\Chat;
use App\Models\Agent;
use App\Models\SubscriptionPlan;

trait OrganizationRelationsTrait
{
    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function chats()
    {
        return $this->hasMany(Chat::class);
    }

    public function agents()
    {
        return $this->hasManyThrough(Agent::class, User::class);
    }

    public function subscriptionPlan()
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }
}
