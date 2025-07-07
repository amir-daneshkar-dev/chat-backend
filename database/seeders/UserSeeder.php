<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Agent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create demo agent
        $agent = User::create([
            'name' => 'Agent Smith',
            'email' => 'agent@demo.com',
            'password' => Hash::make('agent123'),
            'role' => 'agent',
            'is_online' => true,
        ]);

        Agent::create([
            'user_id' => $agent->id,
            'status' => 'available',
            'max_chats' => 5,
            'skills' => ['general_support', 'technical_support'],
        ]);

        // Create demo user
        User::create([
            'name' => 'Demo User',
            'email' => 'user@demo.com',
            'password' => Hash::make('user123'),
            'role' => 'user',
            'is_online' => true,
        ]);

        // Create additional agents
        $agent2 = User::create([
            'name' => 'Agent Johnson',
            'email' => 'agent2@demo.com',
            'password' => Hash::make('agent123'),
            'role' => 'agent',
            'is_online' => true,
        ]);

        Agent::create([
            'user_id' => $agent2->id,
            'status' => 'busy',
            'max_chats' => 3,
            'skills' => ['billing_support', 'account_management'],
        ]);

        // Create admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@demo.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'is_online' => true,
        ]);

        // Create some regular users
        User::factory(10)->create();
    }
}