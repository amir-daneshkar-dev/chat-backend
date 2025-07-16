<?php

namespace Database\Seeders;

use App\Enums\AgentStatus;
use App\Enums\ChatStatus;
use App\Enums\MessageType;
use App\Enums\UserRole;
use App\Models\Agent;
use App\Models\Chat;
use App\Models\Message;
use App\Models\Organization;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure subscription plans exist
        $this->call(SubscriptionPlanSeeder::class);

        // Get subscription plans
        $basicPlan = SubscriptionPlan::where('slug', 'basic')->first();
        $premiumPlan = SubscriptionPlan::where('slug', 'premium')->first();
        $enterprisePlan = SubscriptionPlan::where('slug', 'enterprise')->first();

        // Create organizations with different subscription plans
        $basicOrg = Organization::factory()->create([
            'subscription_plan_id' => $basicPlan->id,
            'status' => 'active',
        ]);
        $premiumOrg = Organization::factory()->create([
            'subscription_plan_id' => $premiumPlan->id,
            'status' => 'active',
        ]);
        $enterpriseOrg = Organization::factory()->create([
            'subscription_plan_id' => $enterprisePlan->id,
            'status' => 'active',
        ]);

        // Create some inactive/suspended organizations
        Organization::factory()->inactive()->count(2)->create();
        Organization::factory()->suspended()->count(1)->create();
        Organization::factory()->expired()->count(1)->create();

        // Create users for each organization
        $this->createOrganizationUsers($basicOrg, 3, 1);
        $this->createOrganizationUsers($premiumOrg, 8, 3);
        $this->createOrganizationUsers($enterpriseOrg, 15, 8);

        // Create chats with messages for each organization
        $this->createOrganizationChats($basicOrg, 5);
        $this->createOrganizationChats($premiumOrg, 15);
        $this->createOrganizationChats($enterpriseOrg, 30);
    }

    /**
     * Create users and agents for an organization.
     */
    private function createOrganizationUsers(Organization $organization, int $userCount, int $agentCount): void
    {
        // Create regular users
        $users = User::factory()
            ->count($userCount)
            ->create(['organization_id' => $organization->id]);

        // Create agents
        $agents = User::factory()
            ->count($agentCount)
            ->create([
                'organization_id' => $organization->id,
                'role' => UserRole::AGENT,
            ]);

        // Create agent records for each agent user
        foreach ($agents as $agentUser) {
            Agent::factory()->create([
                'user_id' => $agentUser->id,
                'status' => fake()->randomElement([
                    AgentStatus::AVAILABLE,
                    AgentStatus::BUSY,
                    AgentStatus::OFFLINE,
                ]),
            ]);
        }
    }

    /**
     * Create chats with messages for an organization.
     */
    private function createOrganizationChats(Organization $organization, int $chatCount): void
    {
        $users = $organization->users()->where('role', UserRole::USER)->get();
        $agents = $organization->users()->where('role', UserRole::AGENT)->get();

        for ($i = 0; $i < $chatCount; $i++) {
            $user = $users->random();
            $agent = $agents->random();
            $status = fake()->randomElement([
                ChatStatus::WAITING,
                ChatStatus::ACTIVE,
                ChatStatus::CLOSED,
            ]);

            $chat = Chat::factory()->create([
                'user_id' => $user->id,
                'agent_id' => $status !== ChatStatus::WAITING ? $agent->id : null,
                'organization_id' => $organization->id,
                'status' => $status,
                'started_at' => fake()->dateTimeBetween('-30 days', 'now'),
                'ended_at' => $status === ChatStatus::CLOSED ? fake()->dateTimeBetween('-30 days', 'now') : null,
            ]);

            // Create messages for this chat
            $this->createChatMessages($chat, $user, $agent);
        }
    }

    /**
     * Create messages for a chat.
     */
    private function createChatMessages(Chat $chat, User $user, User $agent): void
    {
        $messageCount = fake()->numberBetween(3, 15);
        $messages = [];

        for ($i = 0; $i < $messageCount; $i++) {
            $isUserMessage = fake()->boolean(70); // 70% chance of user message
            $sender = $isUserMessage ? $user : $agent;
            $type = fake()->randomElement([
                MessageType::TEXT,
                MessageType::TEXT,
                MessageType::TEXT,
                MessageType::IMAGE,
                MessageType::FILE,
            ]); // Mostly text messages

            $content = $this->generateMessageContent($type);

            $messages[] = [
                'chat_id' => $chat->id,
                'user_id' => $sender->id,
                'organization_id' => $chat->organization_id,
                'type' => $type,
                'content' => $content,
                'is_read' => fake()->boolean(80),
                'created_at' => fake()->dateTimeBetween($chat->started_at, 'now'),
                'updated_at' => fake()->dateTimeBetween($chat->started_at, 'now'),
            ];
        }

        // Sort messages by creation time
        usort($messages, function ($a, $b) {
            return $a['created_at'] <=> $b['created_at'];
        });

        // Insert messages
        foreach ($messages as $message) {
            Message::create($message);
        }
    }

    /**
     * Generate appropriate content based on message type.
     */
    private function generateMessageContent(MessageType $type): string
    {
        return match ($type) {
            MessageType::TEXT => fake()->paragraph(),
            MessageType::IMAGE => fake()->imageUrl(640, 480, 'business'),
            MessageType::FILE => fake()->filePath(),
            MessageType::VOICE => fake()->filePath() . '.mp3',
            MessageType::SYSTEM => fake()->sentence(),
        };
    }
}
