<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => UserRole::USER->value,
            'is_online' => fake()->boolean(30), // 30% chance of being online
            'last_seen_at' => fake()->dateTimeBetween('-1 week', 'now'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn(array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the user is an agent.
     */
    public function agent(): static
    {
        return $this->state(fn(array $attributes) => [
            'role' => UserRole::AGENT->value,
        ]);
    }

    /**
     * Indicate that the user is an admin.
     */
    public function admin(): static
    {
        return $this->state(fn(array $attributes) => [
            'role' => UserRole::ADMIN->value,
        ]);
    }

    /**
     * Indicate that the user belongs to a specific organization.
     */
    public function forOrganization(Organization $organization): static
    {
        return $this->state(fn(array $attributes) => [
            'organization_id' => $organization->id,
        ]);
    }

    /**
     * Indicate that the user belongs to a specific organization by ID.
     */
    public function forOrganizationId(int $organizationId): static
    {
        return $this->state(fn(array $attributes) => [
            'organization_id' => $organizationId,
        ]);
    }
}
