<?php

namespace Database\Factories;

use App\Enums\MessageType;
use App\Models\Chat;
use App\Models\Message;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Message::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'uuid' => Str::uuid(),
            'chat_id' => Chat::factory(),
            'user_id' => User::factory(),
            'organization_id' => Organization::factory(),
            'content' => fake()->paragraph(),
            'type' => MessageType::TEXT,
            'file_url' => null,
            'file_name' => null,
            'file_size' => null,
            'voice_duration' => null,
            'is_read' => fake()->boolean(80),
            'read_at' => fake()->optional(0.7)->dateTimeBetween('-1 hour', 'now'),
            'metadata' => [
                'user_agent' => fake()->userAgent(),
                'ip_address' => fake()->ipv4(),
                'platform' => fake()->randomElement(['web', 'mobile', 'desktop']),
            ],
        ];
    }

    /**
     * Indicate that the message is a text message.
     */
    public function text(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => MessageType::TEXT,
            'content' => fake()->paragraph(),
            'file_url' => null,
            'file_name' => null,
            'file_size' => null,
            'voice_duration' => null,
        ]);
    }

    /**
     * Indicate that the message is a file message.
     */
    public function file(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => MessageType::FILE,
            'content' => 'File uploaded',
            'file_url' => fake()->url(),
            'file_name' => fake()->fileName(),
            'file_size' => fake()->numberBetween(1024, 10485760), // 1KB to 10MB
            'voice_duration' => null,
        ]);
    }

    /**
     * Indicate that the message is an image message.
     */
    public function image(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => MessageType::IMAGE,
            'content' => 'Image shared',
            'file_url' => fake()->imageUrl(),
            'file_name' => fake()->imageUrl(),
            'file_size' => fake()->numberBetween(1024, 5242880), // 1KB to 5MB
            'voice_duration' => null,
        ]);
    }

    /**
     * Indicate that the message is a voice message.
     */
    public function voice(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => MessageType::VOICE,
            'content' => 'Voice message',
            'file_url' => fake()->url(),
            'file_name' => 'voice_message.mp3',
            'file_size' => fake()->numberBetween(10240, 1048576), // 10KB to 1MB
            'voice_duration' => fake()->numberBetween(5, 120), // 5 to 120 seconds
        ]);
    }

    /**
     * Indicate that the message is a system message.
     */
    public function system(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => MessageType::SYSTEM,
            'content' => fake()->randomElement([
                'Agent joined the chat',
                'Chat closed',
                'Welcome to support!',
                'You are #3 in the queue',
            ]),
            'file_url' => null,
            'file_name' => null,
            'file_size' => null,
            'voice_duration' => null,
        ]);
    }

    /**
     * Indicate that the message is from a specific user.
     */
    public function fromUser(User $user): static
    {
        return $this->state(fn(array $attributes) => [
            'user_id' => $user->id,
            'organization_id' => $user->organization_id,
        ]);
    }

    /**
     * Indicate that the message belongs to a specific chat.
     */
    public function forChat(Chat $chat): static
    {
        return $this->state(fn(array $attributes) => [
            'chat_id' => $chat->id,
            'organization_id' => $chat->organization_id,
        ]);
    }

    /**
     * Indicate that the message is unread.
     */
    public function unread(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_read' => false,
            'read_at' => null,
        ]);
    }

    /**
     * Indicate that the message is read.
     */
    public function read(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_read' => true,
            'read_at' => fake()->dateTimeBetween('-1 hour', 'now'),
        ]);
    }

    /**
     * Indicate that the message was sent recently.
     */
    public function recent(): static
    {
        return $this->state(fn(array $attributes) => [
            'created_at' => fake()->dateTimeBetween('-30 minutes', 'now'),
        ]);
    }

    /**
     * Indicate that the message was sent in the past.
     */
    public function old(): static
    {
        return $this->state(fn(array $attributes) => [
            'created_at' => fake()->dateTimeBetween('-7 days', '-1 day'),
        ]);
    }
}
