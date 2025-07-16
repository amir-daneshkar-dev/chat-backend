<?php

namespace Database\Factories;

use App\Enums\ChatStatus;
use App\Models\Chat;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Chat>
 */
class ChatFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Chat::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'uuid' => Str::uuid(),
            'user_id' => User::factory(),
            'organization_id' => Organization::factory(),
            'agent_id' => null,
            'status' => ChatStatus::WAITING,
            'queue_position' => fake()->numberBetween(1, 10),
            'started_at' => null,
            'ended_at' => null,
            'metadata' => [
                'user_agent' => fake()->userAgent(),
                'ip_address' => fake()->ipv4(),
                'referrer' => fake()->optional()->url(),
                'page_url' => fake()->url(),
            ],
        ];
    }

    /**
     * Indicate that the chat is waiting for an agent.
     */
    public function waiting(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => ChatStatus::WAITING,
            'agent_id' => null,
            'started_at' => null,
            'ended_at' => null,
        ]);
    }

    /**
     * Indicate that the chat is active with an assigned agent.
     */
    public function active(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => ChatStatus::ACTIVE,
            'agent_id' => User::factory()->create(['role' => 'agent']),
            'started_at' => fake()->dateTimeBetween('-2 hours', 'now'),
            'ended_at' => null,
            'queue_position' => null,
        ]);
    }

    /**
     * Indicate that the chat is closed.
     */
    public function closed(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => ChatStatus::CLOSED,
            'agent_id' => User::factory()->create(['role' => 'agent']),
            'started_at' => fake()->dateTimeBetween('-4 hours', '-2 hours'),
            'ended_at' => fake()->dateTimeBetween('-2 hours', 'now'),
            'queue_position' => null,
        ]);
    }

    /**
     * Indicate that the chat has a specific user.
     */
    public function forUser(User $user): static
    {
        return $this->state(fn(array $attributes) => [
            'user_id' => $user->id,
            'organization_id' => $user->organization_id,
        ]);
    }

    /**
     * Indicate that the chat has a specific agent.
     */
    public function withAgent(User $agent): static
    {
        return $this->state(fn(array $attributes) => [
            'agent_id' => $agent->id,
            'status' => ChatStatus::ACTIVE,
            'started_at' => fake()->dateTimeBetween('-2 hours', 'now'),
        ]);
    }

    /**
     * Indicate that the chat belongs to a specific organization.
     */
    public function forOrganization(Organization $organization): static
    {
        return $this->state(fn(array $attributes) => [
            'organization_id' => $organization->id,
        ]);
    }

    /**
     * Indicate that the chat was created recently.
     */
    public function recent(): static
    {
        return $this->state(fn(array $attributes) => [
            'created_at' => fake()->dateTimeBetween('-1 hour', 'now'),
        ]);
    }

    /**
     * Indicate that the chat was created in the past.
     */
    public function old(): static
    {
        return $this->state(fn(array $attributes) => [
            'created_at' => fake()->dateTimeBetween('-30 days', '-7 days'),
        ]);
    }
}
