<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            ApplicationSetupSeeder::class,  // Creates initial organization, admin, and agent
            ChatSeeder::class,              // Creates chats for the default organization
            DemoDataSeeder::class,          // Creates additional organizations and data
        ]);
    }
}
