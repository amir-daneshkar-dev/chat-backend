<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use App\Models\Organization;
use App\Enums\UserRole;
use Illuminate\Database\Seeder;

class ChatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the default organization (should be created by UserSeeder)
        $defaultOrganization = Organization::where('domain', 'demo.com')->first();

        if (!$defaultOrganization) {
            // Fallback: create organization if it doesn't exist
            $defaultOrganization = Organization::factory()->create([
                'name' => 'Demo Organization',
                'domain' => 'demo.com',
            ]);
        }

        $users = User::where('role', UserRole::USER)->where('organization_id', $defaultOrganization->id)->take(5)->get();
        $agents = User::where('role', UserRole::AGENT)->where('organization_id', $defaultOrganization->id)->get();

        foreach ($users as $index => $user) {
            $chat = Chat::factory()->create([
                'user_id' => $user->id,
                'agent_id' => $index < 2 ? $agents->first()->id : null,
                'organization_id' => $defaultOrganization->id,
                'status' => $index < 2 ? 'active' : 'waiting',
                'queue_position' => $index >= 2 ? $index - 1 : null,
                'started_at' => $index < 2 ? now()->subMinutes(rand(5, 60)) : null,
            ]);

            // Create some messages
            if ($chat->status === 'active') {
                Message::factory()->create([
                    'chat_id' => $chat->id,
                    'user_id' => $user->id,
                    'organization_id' => $defaultOrganization->id,
                    'content' => 'Hello, I need help with my account.',
                    'type' => 'text',
                    'is_read' => true,
                ]);

                Message::factory()->create([
                    'chat_id' => $chat->id,
                    'user_id' => $chat->agent_id,
                    'organization_id' => $defaultOrganization->id,
                    'content' => 'Hi! I\'d be happy to help you with your account. What specific issue are you experiencing?',
                    'type' => 'text',
                    'is_read' => true,
                ]);

                Message::factory()->create([
                    'chat_id' => $chat->id,
                    'user_id' => $user->id,
                    'organization_id' => $defaultOrganization->id,
                    'content' => 'I can\'t access my billing information.',
                    'type' => 'text',
                    'is_read' => false,
                ]);
            } else {
                Message::factory()->create([
                    'chat_id' => $chat->id,
                    'user_id' => $user->id,
                    'organization_id' => $defaultOrganization->id,
                    'content' => 'Hi, I need assistance with my order.',
                    'type' => 'text',
                    'is_read' => false,
                ]);
            }
        }
    }
}
