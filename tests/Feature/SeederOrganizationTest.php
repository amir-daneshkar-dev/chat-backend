<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Organization;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SeederOrganizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_users_have_organization_after_seeding()
    {
        // Run the seeders
        $this->artisan('db:seed');

        // Check that all users have an organization_id
        $usersWithoutOrganization = User::whereNull('organization_id')->count();
        $this->assertEquals(0, $usersWithoutOrganization, 'All users should have an organization_id');

        // Verify that the default organization exists
        $defaultOrg = Organization::where('domain', 'demo.com')->first();
        $this->assertNotNull($defaultOrg, 'Default organization should exist');

        // Check that at least some users belong to the default organization
        $usersInDefaultOrg = User::where('organization_id', $defaultOrg->id)->count();
        $this->assertGreaterThan(0, $usersInDefaultOrg, 'At least some users should belong to the default organization');

        // Check that all users belong to some organization
        $totalUsers = User::count();
        $usersWithAnyOrg = User::whereNotNull('organization_id')->count();
        $this->assertEquals($totalUsers, $usersWithAnyOrg, 'All users should belong to some organization');
    }

    public function test_demo_organization_has_correct_users()
    {
        // Run the seeders
        $this->artisan('db:seed');

        $defaultOrg = Organization::where('domain', 'demo.com')->first();

        // Check that we have the expected users
        $demoUsers = User::where('organization_id', $defaultOrg->id)->get();

        // Should have at least the specific demo users
        $expectedEmails = [
            'agent@demo.com',
            'user@demo.com',
            'agent2@demo.com',
            'admin@demo.com'
        ];

        foreach ($expectedEmails as $email) {
            $this->assertTrue(
                $demoUsers->contains('email', $email),
                "User with email {$email} should exist in the default organization"
            );
        }

        // Check user roles
        $agents = $demoUsers->where('role', UserRole::AGENT);
        $users = $demoUsers->where('role', UserRole::USER);
        $admins = $demoUsers->where('role', UserRole::ADMIN);

        $this->assertGreaterThan(0, $agents->count(), 'Should have at least one agent');
        $this->assertGreaterThan(0, $users->count(), 'Should have at least one user');
        $this->assertGreaterThan(0, $admins->count(), 'Should have at least one admin');
    }

    public function test_multiple_organizations_exist()
    {
        // Run the seeders
        $this->artisan('db:seed');

        // Check that multiple organizations exist (from DemoDataSeeder)
        $organizations = Organization::all();
        $this->assertGreaterThan(1, $organizations->count(), 'Should have multiple organizations');

        // Check that organizations with subscription plans have users (these are the ones we explicitly create)
        $organizationsWithPlans = Organization::whereNotNull('subscription_plan_id')->where('status', 'active')->get();
        foreach ($organizationsWithPlans as $org) {
            $userCount = $org->users()->count();
            $this->assertGreaterThan(0, $userCount, "Organization with plan {$org->name} should have users");
        }

        // Check that we have at least some organizations with users
        $organizationsWithUsers = Organization::has('users')->get();
        $this->assertGreaterThan(0, $organizationsWithUsers->count(), 'Should have at least some organizations with users');

        // Check that the default organization exists and has users
        $defaultOrg = Organization::where('domain', 'demo.com')->first();
        $this->assertNotNull($defaultOrg, 'Default organization should exist');
        $this->assertGreaterThan(0, $defaultOrg->users()->count(), 'Default organization should have users');
    }

    public function test_organization_relationships_work_correctly()
    {
        // Run the seeders
        $this->artisan('db:seed');

        $defaultOrg = Organization::where('domain', 'demo.com')->first();

        // Test that users can access their organization
        $user = User::where('organization_id', $defaultOrg->id)->first();
        $this->assertNotNull($user->organization);
        $this->assertEquals($defaultOrg->id, $user->organization->id);

        // Test that organization can access its users
        $this->assertGreaterThan(0, $defaultOrg->users->count());
        $this->assertTrue($defaultOrg->users->contains($user));
    }

    public function test_no_orphaned_users_exist()
    {
        // Run the seeders
        $this->artisan('db:seed');

        // Check for any users without organization
        $orphanedUsers = User::whereNull('organization_id')->get();
        $this->assertCount(0, $orphanedUsers, 'No users should exist without an organization');

        // Check for any users with non-existent organization
        $usersWithInvalidOrg = User::whereNotNull('organization_id')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('organizations')
                    ->whereRaw('organizations.id = users.organization_id');
            })->get();

        $this->assertCount(0, $usersWithInvalidOrg, 'No users should reference non-existent organizations');
    }

    public function test_organization_distribution()
    {
        // Run the seeders
        $this->artisan('db:seed');

        // Get organizations that have users (active organizations)
        $organizationsWithUsers = Organization::has('users')->withCount('users')->get();

        // Should have at least the default organization plus the 3 subscription plan organizations
        $this->assertGreaterThanOrEqual(4, $organizationsWithUsers->count(), 'Should have at least 4 organizations with users');

        // Check that organizations have different user counts (indicating different subscription plans)
        $userCounts = $organizationsWithUsers->pluck('users_count')->toArray();
        $uniqueCounts = array_unique($userCounts);
        $this->assertGreaterThan(1, count($uniqueCounts), 'Organizations should have different user counts');

        // Verify specific organizations exist
        $defaultOrg = Organization::where('domain', 'demo.com')->first();
        $this->assertNotNull($defaultOrg, 'Default organization should exist');
        $this->assertGreaterThan(0, $defaultOrg->users()->count(), 'Default organization should have users');
    }
}
