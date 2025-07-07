<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Database\Seeder;

class ChatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::where('role', 'user')->take(5)->get();
        $agents = User::where('role', 'agent')->get();

        foreach ($users as $index => $user) {
            $chat = Chat::create([
                'user_id' => $user->id,
                'agent_id' => $index < 2 ? $agents->first()->id : null,
                'status' => $index < 2 ? 'active' : 'waiting',
                'queue_position' => $index >= 2 ? $index - 1 : null,
                'started_at' => $index < 2 ? now()->subMinutes(rand(5, 60)) : null,
            ]);

            // Create some messages
            if ($chat->status === 'active') {
                Message::create([
                    'chat_id' => $chat->id,
                    'user_id' => $user->id,
                    'content' => 'Hello, I need help with my account.',
                    'type' => 'text',
                    'is_read' => true,
                ]);

                Message::create([
                    'chat_id' => $chat->id,
                    'user_id' => $chat->agent_id,
                    'content' => 'Hi! I\'d be happy to help you with your account. What specific issue are you experiencing?',
                    'type' => 'text',
                    'is_read' => true,
                ]);

                Message::create([
                    'chat_id' => $chat->id,
                    'user_id' => $user->id,
                    'content' => 'I can\'t access my billing information.',
                    'type' => 'text',
                    'is_read' => false,
                ]);
            } else {
                Message::create([
                    'chat_id' => $chat->id,
                    'user_id' => $user->id,
                    'content' => 'Hi, I need assistance with my order.',
                    'type' => 'text',
                    'is_read' => false,
                ]);
            }
        }
    }
}