<?php

namespace Database\Factories;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SubscriptionPlan>
 */
class SubscriptionPlanFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = SubscriptionPlan::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);
        $slug = Str::slug($name);

        return [
            'name' => ucwords($name),
            'slug' => $slug,
            'description' => fake()->sentence(),
            'monthly_price' => fake()->randomFloat(2, 10, 500),
            'yearly_price' => fake()->optional()->randomFloat(2, 100, 5000),
            'max_agents' => fake()->numberBetween(1, 100),
            'max_chats_per_agent' => fake()->numberBetween(1, 20),
            'features' => fake()->randomElements([
                'chat_widget',
                'basic_analytics',
                'advanced_analytics',
                'email_notifications',
                'chat_transcripts',
                'agent_performance_reports',
                'custom_integrations',
                'dedicated_account_manager',
                'sla_guarantees',
                'white_label_options',
            ], fake()->numberBetween(3, 8)),
            'is_active' => true,
            'sort_order' => fake()->numberBetween(1, 10),
        ];
    }

    /**
     * Indicate that the plan is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Create a basic plan.
     */
    public function basic(): static
    {
        return $this->state(fn(array $attributes) => [
            'name' => 'Basic',
            'slug' => 'basic',
            'description' => 'Perfect for small teams getting started with chat support',
            'monthly_price' => 29.99,
            'yearly_price' => 299.99,
            'max_agents' => 5,
            'max_chats_per_agent' => 3,
            'features' => [
                'chat_widget',
                'basic_analytics',
                'email_notifications',
            ],
            'sort_order' => 1,
        ]);
    }

    /**
     * Create a premium plan.
     */
    public function premium(): static
    {
        return $this->state(fn(array $attributes) => [
            'name' => 'Premium',
            'slug' => 'premium',
            'description' => 'Advanced features for growing support teams',
            'monthly_price' => 79.99,
            'yearly_price' => 799.99,
            'max_agents' => 15,
            'max_chats_per_agent' => 5,
            'features' => [
                'chat_widget',
                'advanced_analytics',
                'email_notifications',
                'custom_widget_styling',
                'chat_transcripts',
                'agent_performance_reports',
            ],
            'sort_order' => 2,
        ]);
    }

    /**
     * Create an enterprise plan.
     */
    public function enterprise(): static
    {
        return $this->state(fn(array $attributes) => [
            'name' => 'Enterprise',
            'slug' => 'enterprise',
            'description' => 'Full-featured solution for large organizations',
            'monthly_price' => 199.99,
            'yearly_price' => 1999.99,
            'max_agents' => 50,
            'max_chats_per_agent' => 10,
            'features' => [
                'chat_widget',
                'advanced_analytics',
                'email_notifications',
                'chat_transcripts',
                'agent_performance_reports',
                'custom_integrations',
                'dedicated_account_manager',
                'sla_guarantees',
                'white_label_options',
            ],
            'sort_order' => 3,
        ]);
    }
}
