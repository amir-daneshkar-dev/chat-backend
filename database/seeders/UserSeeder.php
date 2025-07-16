<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Agent;
use App\Models\Organization;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a default organization for demo users
        $defaultOrganization = Organization::factory()->create([
            'name' => 'Demo Organization',
            'domain' => 'demo.com',
        ]);

        // Create demo agent
        $agent = User::factory()->agent()->create([
            'name' => 'Agent Smith',
            'email' => 'agent@demo.com',
            'password' => 'agent123',
            'is_online' => true,
            'organization_id' => $defaultOrganization->id,
        ]);

        Agent::factory()->create([
            'user_id' => $agent->id,
            'status' => 'available',
            'max_chats' => 5,
            'skills' => ['general_support', 'technical_support'],
        ]);

        // Create demo user
        User::factory()->create([
            'name' => 'Demo User',
            'email' => 'user@demo.com',
            'password' => 'user123',
            'is_online' => true,
            'organization_id' => $defaultOrganization->id,
        ]);

        // Create additional agent
        $agent2 = User::factory()->agent()->create([
            'name' => 'Agent Johnson',
            'email' => 'agent2@demo.com',
            'password' => 'agent123',
            'is_online' => true,
            'organization_id' => $defaultOrganization->id,
        ]);

        Agent::factory()->create([
            'user_id' => $agent2->id,
            'status' => 'busy',
            'max_chats' => 3,
            'skills' => ['billing_support', 'account_management'],
        ]);

        // Create admin user
        User::factory()->admin()->create([
            'name' => 'Admin User',
            'email' => 'admin@demo.com',
            'password' => 'admin123',
            'is_online' => true,
            'organization_id' => $defaultOrganization->id,
        ]);

        // Create some regular users
        User::factory(10)->create(['organization_id' => $defaultOrganization->id]);

        // Create some additional agents with factories
        User::factory(3)->agent()->create(['organization_id' => $defaultOrganization->id])->each(function ($user) {
            Agent::factory()->create([
                'user_id' => $user->id,
            ]);
        });
    }
}
