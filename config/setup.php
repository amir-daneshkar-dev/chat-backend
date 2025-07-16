<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Application Setup Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the default configuration for setting up the initial
    | organization, admin user, and agent user when running the ApplicationSetupSeeder.
    |
    */

    'organization' => [
        'name' => env('SETUP_ORG_NAME', 'Demo Organization'),
        'domain' => env('SETUP_ORG_DOMAIN', 'demo.example.com'),
    ],

    'admin' => [
        'name' => env('SETUP_ADMIN_NAME', 'Admin User'),
        'email' => env('SETUP_ADMIN_EMAIL', 'admin@example.com'),
        'password' => env('SETUP_ADMIN_PASSWORD', 'password'),
    ],

    'agent' => [
        'name' => env('SETUP_AGENT_NAME', 'Support Agent'),
        'email' => env('SETUP_AGENT_EMAIL', 'agent@example.com'),
        'password' => env('SETUP_AGENT_PASSWORD', 'password'),
    ],
];
