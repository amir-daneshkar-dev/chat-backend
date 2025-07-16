<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Agent;
use App\Models\Chat;
use App\Models\Message;
use App\Models\Organization;
use App\Models\SubscriptionPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FactoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_factory_creates_valid_user()
    {
        $user = User::factory()->create();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => $user->email,
        ]);

        $this->assertNotNull($user->name);
        $this->assertNotNull($user->email);
        $this->assertNotNull($user->password);
    }

    public function test_user_factory_creates_agent()
    {
        $user = User::factory()->agent()->create();

        $this->assertEquals('agent', $user->role->value);
    }

    public function test_user_factory_creates_admin()
    {
        $user = User::factory()->admin()->create();

        $this->assertEquals('admin', $user->role->value);
    }

    public function test_agent_factory_creates_valid_agent()
    {
        $agent = Agent::factory()->create();

        $this->assertDatabaseHas('agents', [
            'id' => $agent->id,
            'user_id' => $agent->user_id,
        ]);

        $this->assertNotNull($agent->status);
        $this->assertNotNull($agent->max_chats);
        $this->assertIsArray($agent->skills);
    }

    public function test_agent_factory_with_different_states()
    {
        $availableAgent = Agent::factory()->available()->create();
        $busyAgent = Agent::factory()->busy()->create();
        $offlineAgent = Agent::factory()->offline()->create();

        $this->assertEquals('available', $availableAgent->status->value);
        $this->assertEquals('busy', $busyAgent->status->value);
        $this->assertEquals('offline', $offlineAgent->status->value);
    }

    public function test_organization_factory_creates_valid_organization()
    {
        $organization = Organization::factory()->create();

        $this->assertDatabaseHas('organizations', [
            'id' => $organization->id,
            'name' => $organization->name,
        ]);

        $this->assertNotNull($organization->name);
        $this->assertNotNull($organization->api_key);
    }

    public function test_subscription_plan_factory_creates_valid_plan()
    {
        $plan = SubscriptionPlan::factory()->create();

        $this->assertDatabaseHas('subscription_plans', [
            'id' => $plan->id,
            'name' => $plan->name,
        ]);

        $this->assertNotNull($plan->name);
        $this->assertNotNull($plan->slug);
        $this->assertNotNull($plan->monthly_price);
    }

    public function test_chat_factory_creates_valid_chat()
    {
        $chat = Chat::factory()->create();

        $this->assertDatabaseHas('chats', [
            'id' => $chat->id,
        ]);

        $this->assertNotNull($chat->status);
    }

    public function test_message_factory_creates_valid_message()
    {
        $message = Message::factory()->create();

        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
        ]);

        $this->assertNotNull($message->content);
        $this->assertNotNull($message->type);
    }

    public function test_factories_with_relationships()
    {
        // Create a user with an agent record
        $user = User::factory()->agent()->create();
        $agent = Agent::factory()->create(['user_id' => $user->id]);

        $this->assertEquals($user->id, $agent->user_id);

        // Create a chat with messages
        $chat = Chat::factory()->create(['user_id' => $user->id]);
        $message = Message::factory()->create(['chat_id' => $chat->id, 'user_id' => $user->id]);

        $this->assertEquals($chat->id, $message->chat_id);
        $this->assertEquals($user->id, $message->user_id);
    }
}
