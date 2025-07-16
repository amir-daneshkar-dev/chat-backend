<?php

namespace Database\Factories;

use App\Enums\AgentStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Agent>
 */
class AgentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->agent(),
            'status' => AgentStatus::AVAILABLE,
            'active_chats' => fake()->numberBetween(0, 3),
            'max_chats' => fake()->numberBetween(3, 8),
            'skills' => fake()->randomElements([
                'general_support',
                'technical_support',
                'billing_support',
                'account_management',
                'product_support',
                'sales_support'
            ], fake()->numberBetween(1, 3)),
        ];
    }

    /**
     * Indicate that the agent is available.
     */
    public function available(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => AgentStatus::AVAILABLE,
        ]);
    }

    /**
     * Indicate that the agent is busy.
     */
    public function busy(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => AgentStatus::BUSY,
        ]);
    }

    /**
     * Indicate that the agent is offline.
     */
    public function offline(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => AgentStatus::OFFLINE,
        ]);
    }

    /**
     * Set specific skills for the agent.
     */
    public function withSkills(array $skills): static
    {
        return $this->state(fn(array $attributes) => [
            'skills' => $skills,
        ]);
    }

    /**
     * Set maximum chats for the agent.
     */
    public function withMaxChats(int $maxChats): static
    {
        return $this->state(fn(array $attributes) => [
            'max_chats' => $maxChats,
        ]);
    }
}
