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
            UserSeeder::class,        // Creates default organization and users
            ChatSeeder::class,        // Creates chats for the default organization
            DemoDataSeeder::class,    // Creates additional organizations and data
        ]);
    }
}
