<?php

namespace Database\Factories;

use App\Enums\OrganizationStatus;
use App\Models\Organization;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Organization>
 */
class OrganizationFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Organization::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'domain' => fake()->domainName(),
            'api_key' => Str::random(32),
            'status' => OrganizationStatus::ACTIVE,
            'settings' => [
                'chat_widget_enabled' => true,
                'max_agents' => fake()->numberBetween(5, 20),
                'max_chats_per_agent' => fake()->numberBetween(3, 8),
                'widget_color' => fake()->hexColor(),
                'widget_position' => fake()->randomElement(['bottom-right', 'bottom-left']),
            ],
            'subscription_plan_id' => null, // Don't create subscription plan by default
            'subscription_expires_at' => fake()->optional(0.8)->dateTimeBetween('now', '+2 years'),
        ];
    }

    /**
     * Indicate that the organization is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => OrganizationStatus::INACTIVE,
        ]);
    }

    /**
     * Indicate that the organization is suspended.
     */
    public function suspended(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => OrganizationStatus::SUSPENDED,
        ]);
    }

    /**
     * Indicate that the organization has an expired subscription.
     */
    public function expired(): static
    {
        return $this->state(fn(array $attributes) => [
            'subscription_expires_at' => fake()->dateTimeBetween('-1 year', '-1 day'),
        ]);
    }

    /**
     * Indicate that the organization has a basic plan.
     */
    public function basic(): static
    {
        return $this->state(fn(array $attributes) => [
            'subscription_plan_id' => SubscriptionPlan::factory()->basic(),
            'settings' => [
                'chat_widget_enabled' => true,
                'max_agents' => 5,
                'max_chats_per_agent' => 3,
            ],
        ]);
    }

    /**
     * Indicate that the organization has a premium plan.
     */
    public function premium(): static
    {
        return $this->state(fn(array $attributes) => [
            'subscription_plan_id' => SubscriptionPlan::factory()->premium(),
            'settings' => [
                'chat_widget_enabled' => true,
                'max_agents' => 15,
                'max_chats_per_agent' => 5,
                'advanced_analytics' => true,
            ],
        ]);
    }

    /**
     * Indicate that the organization has an enterprise plan.
     */
    public function enterprise(): static
    {
        return $this->state(fn(array $attributes) => [
            'subscription_plan_id' => SubscriptionPlan::factory()->enterprise(),
            'settings' => [
                'chat_widget_enabled' => true,
                'max_agents' => 50,
                'max_chats_per_agent' => 10,
                'advanced_analytics' => true,
            ],
        ]);
    }

    /**
     * Indicate that the organization has no subscription plan.
     */
    public function withoutPlan(): static
    {
        return $this->state(fn(array $attributes) => [
            'subscription_plan_id' => null,
            'settings' => [
                'chat_widget_enabled' => true,
                'max_agents' => config('subscription_plan.max_agents'),
                'max_chats_per_agent' => config('subscription_plan.max_chats_per_agent'),
                'advanced_analytics' => config('subscription_plan.advanced_analytics'),
            ],
        ]);
    }

    /**
     * Indicate that the organization should have a subscription plan.
     */
    public function withPlan(): static
    {
        return $this->state(fn(array $attributes) => [
            'subscription_plan_id' => SubscriptionPlan::factory(),
        ]);
    }
}
