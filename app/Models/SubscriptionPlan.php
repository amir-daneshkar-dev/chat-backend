<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'monthly_price',
        'yearly_price',
        'max_agents',
        'max_chats_per_agent',
        'features',
        'is_active',
        'sort_order',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'features' => 'array',
        'is_active' => 'boolean',
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
        'max_agents' => 'integer',
        'max_chats_per_agent' => 'integer',
        'sort_order' => 'integer',
    ];

    /**
     * Get the organizations that use this subscription plan.
     */
    public function organizations(): HasMany
    {
        return $this->hasMany(Organization::class);
    }

    /**
     * Check if the plan has a specific feature.
     */
    public function hasFeature(string $feature): bool
    {
        return in_array($feature, $this->features ?? []);
    }

    /**
     * Check if the plan has advanced analytics.
     */
    public function hasAdvancedAnalytics(): bool
    {
        return $this->hasFeature('advanced_analytics');
    }


    /**
     * Check if the plan has chat widget.
     */
    public function hasChatWidget(): bool
    {
        return $this->hasFeature('chat_widget');
    }

    /**
     * Get the yearly price with discount applied.
     */
    public function getYearlyPriceWithDiscount(): float
    {
        return $this->yearly_price ?? ($this->monthly_price * 10); // 2 months free
    }

    /**
     * Scope to active plans.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by sort order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('monthly_price');
    }
}
