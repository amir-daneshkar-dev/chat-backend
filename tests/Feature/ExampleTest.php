<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\SubscriptionPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    /**
     * Test that organizations can be created without subscription plans.
     */
    public function test_organization_can_be_created_without_subscription_plan(): void
    {
        // Create an organization without a subscription plan
        $organization = Organization::factory()->withoutPlan()->create();

        // Verify the organization has no subscription plan
        $this->assertNull($organization->subscription_plan_id);
        $this->assertNull($organization->subscriptionPlan);
        $this->assertFalse($organization->hasSubscriptionPlan());

        // Verify it uses config defaults
        $defaultSettings = $organization->getDefaultSettings();
        $this->assertEquals(config('subscription_plan.max_agents'), $defaultSettings['max_agents']);
        $this->assertEquals(config('subscription_plan.max_chats_per_agent'), $defaultSettings['max_chats_per_agent']);
        $this->assertEquals(config('subscription_plan.advanced_analytics'), $defaultSettings['advanced_analytics']);
    }

    /**
     * Test that organizations with subscription plans use plan settings.
     */
    public function test_organization_with_subscription_plan_uses_plan_settings(): void
    {
        // Create a subscription plan
        $plan = SubscriptionPlan::factory()->create([
            'max_agents' => 25,
            'max_chats_per_agent' => 7,
            'features' => ['advanced_analytics'],
        ]);

        // Create an organization with the subscription plan
        $organization = Organization::factory()->create([
            'subscription_plan_id' => $plan->id,
        ]);

        // Verify the organization has the subscription plan
        $this->assertNotNull($organization->subscription_plan_id);
        $this->assertNotNull($organization->subscriptionPlan);
        $this->assertTrue($organization->hasSubscriptionPlan());

        // Verify it uses plan settings
        $defaultSettings = $organization->getDefaultSettings();
        $this->assertEquals(25, $defaultSettings['max_agents']);
        $this->assertEquals(7, $defaultSettings['max_chats_per_agent']);
        $this->assertTrue($defaultSettings['advanced_analytics']);
    }
}
