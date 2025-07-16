<?php

namespace App\Models;

use App\Enums\OrganizationStatus;
use App\Models\Relations\OrganizationRelationsTrait;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Organization extends Model
{
    use HasFactory, OrganizationRelationsTrait;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'domain',
        'api_key',
        'status',
        'settings',
        'subscription_plan_id',
        'subscription_expires_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'settings' => 'array',
        'subscription_expires_at' => 'datetime',
        'status' => OrganizationStatus::class,
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($organization) {
            if (empty($organization->api_key)) {
                $organization->api_key = Str::random(32);
            }
        });
    }

    /**
     * Check if organization is active.
     */
    public function isActive(): bool
    {
        return $this->status->isActive();
    }

    /**
     * Check if organization subscription is valid.
     */
    public function hasValidSubscription(): bool
    {
        if (!$this->subscription_expires_at) {
            return true; // No expiration set
        }

        return $this->subscription_expires_at->isFuture();
    }

    /**
     * Generate a new API key.
     */
    public function regenerateApiKey(): void
    {
        $this->update(['api_key' => Str::random(32)]);
    }

    /**
     * Get the default settings for the subscription plan.
     */
    public function getDefaultSettings(): array
    {
        if (!$this->subscriptionPlan) {
            return [
                'chat_widget_enabled' => true,
                'max_agents' => config('subscription_plan.max_agents'),
                'max_chats_per_agent' => config('subscription_plan.max_chats_per_agent'),
                'advanced_analytics' => config('subscription_plan.advanced_analytics'),
            ];
        }

        return [
            'chat_widget_enabled' => true,
            'max_agents' => $this->subscriptionPlan->max_agents,
            'max_chats_per_agent' => $this->subscriptionPlan->max_chats_per_agent,
            'advanced_analytics' => $this->subscriptionPlan->hasFeature('advanced_analytics'),
        ];
    }

    /**
     * Check if organization has advanced analytics.
     */
    public function hasAdvancedAnalytics(): bool
    {
        return $this->subscriptionPlan?->hasFeature('advanced_analytics') ?? false;
    }

    /**
     * Check if organization has a subscription plan assigned.
     */
    public function hasSubscriptionPlan(): bool
    {
        return $this->subscriptionPlan !== null;
    }
}
