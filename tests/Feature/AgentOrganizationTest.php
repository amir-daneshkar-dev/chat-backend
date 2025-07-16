<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Agent;
use App\Models\Organization;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgentOrganizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_can_access_organization_through_user()
    {
        // Create an organization
        $organization = Organization::factory()->create();

        // Create a user with agent role in the organization
        $user = User::factory()->agent()->create([
            'organization_id' => $organization->id,
        ]);

        // Create an agent record for the user
        $agent = Agent::factory()->create([
            'user_id' => $user->id,
        ]);

        // Test that the agent can access the organization
        $this->assertEquals($organization->id, $agent->organization->id);
        $this->assertEquals($organization->name, $agent->organization->name);
    }

    public function test_agent_organization_relationship_works_with_factory()
    {
        // Create an organization
        $organization = Organization::factory()->create();

        // Create a user with agent role in the organization
        $user = User::factory()->agent()->create([
            'organization_id' => $organization->id,
        ]);

        // Create an agent using factory (which creates its own user)
        // But we'll override the user_id to use our specific user
        $agent = Agent::factory()->create([
            'user_id' => $user->id,
        ]);

        // Test the relationship
        $this->assertNotNull($agent->organization);
        $this->assertEquals($organization->id, $agent->organization->id);
    }

    public function test_agent_without_organization_returns_null()
    {
        // Create a user without organization
        $user = User::factory()->agent()->create([
            'organization_id' => null,
        ]);

        // Create an agent record
        $agent = Agent::factory()->create([
            'user_id' => $user->id,
        ]);

        // Test that organization is null
        $this->assertNull($agent->organization);
    }

    public function test_agent_user_relationship()
    {
        // Create an organization
        $organization = Organization::factory()->create();

        // Create a user with agent role
        $user = User::factory()->agent()->create([
            'organization_id' => $organization->id,
        ]);

        // Create an agent record
        $agent = Agent::factory()->create([
            'user_id' => $user->id,
        ]);

        // Test the user relationship
        $this->assertEquals($user->id, $agent->user->id);
        $this->assertEquals($user->name, $agent->user->name);
        $this->assertEquals($user->email, $agent->user->email);
    }

    public function test_agent_organization_access_through_user()
    {
        // Create an organization
        $organization = Organization::factory()->create();

        // Create a user with agent role
        $user = User::factory()->agent()->create([
            'organization_id' => $organization->id,
        ]);

        // Create an agent record
        $agent = Agent::factory()->create([
            'user_id' => $user->id,
        ]);

        // Test accessing organization through user
        $this->assertEquals($organization->id, $agent->user->organization->id);
        $this->assertEquals($organization->id, $agent->organization->id);
    }
}
