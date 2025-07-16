<?php

namespace Database\Seeders;

use App\Enums\AgentStatus;
use App\Enums\OrganizationStatus;
use App\Enums\UserRole;
use App\Models\Agent;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ApplicationSetupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Setting up initial application...');

        // Get configuration values
        $orgConfig = config('setup.organization');
        $adminConfig = config('setup.admin');
        $agentConfig = config('setup.agent');

        // Create the organization
        $organization = Organization::updateOrCreate(
            ['domain' => $orgConfig['domain']],
            [
                'name' => $orgConfig['name'],
                'status' => OrganizationStatus::ACTIVE,
                'settings' => [
                    'chat_widget_enabled' => true,
                    'max_agents' => 50,
                    'max_chats_per_agent' => 10,
                    'advanced_analytics' => true,
                ],
            ]
        );

        $this->command->info("Organization '{$organization->name}' created/updated.");

        // Create the admin user
        $admin = User::updateOrCreate(
            ['email' => $adminConfig['email']],
            [
                'name' => $adminConfig['name'],
                'email' => $adminConfig['email'],
                'password' => Hash::make($adminConfig['password']),
                'role' => UserRole::ADMIN,
                'organization_id' => $organization->id,
                'is_online' => false,
            ]
        );

        $this->command->info("Admin user '{$admin->name}' created/updated.");

        // Create the agent user
        $agent = User::updateOrCreate(
            ['email' => $agentConfig['email']],
            [
                'name' => $agentConfig['name'],
                'email' => $agentConfig['email'],
                'password' => Hash::make($agentConfig['password']),
                'role' => UserRole::AGENT,
                'organization_id' => $organization->id,
                'is_online' => false,
            ]
        );

        $this->command->info("Agent user '{$agent->name}' created/updated.");

        // Create the agent record
        $agentRecord = Agent::updateOrCreate(
            ['user_id' => $agent->id],
            [
                'user_id' => $agent->id,
                'status' => AgentStatus::AVAILABLE,
                'active_chats' => 0,
                'max_chats' => 10,
                'skills' => ['general_support'],
            ]
        );

        $this->command->info("Agent record for '{$agent->name}' created/updated.");

        $this->command->info('Application setup completed successfully!');
        $this->command->info('');
        $this->command->info('Created:');
        $this->command->info("- Organization: {$organization->name} ({$organization->domain})");
        $this->command->info("- Admin: {$admin->name} ({$admin->email})");
        $this->command->info("- Agent: {$agent->name} ({$agent->email})");
        $this->command->info('');
        $this->command->info('You can now log in with these credentials.');
    }
}
