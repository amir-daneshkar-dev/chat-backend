<?php

return [
    'enable_subscriptions' => false, // for testing purposes false, production true
    'max_agents' => env('MAX_AGENTS', 5),
    'max_chats_per_agent' => env('MAX_CHATS_PER_AGENT', 3),
    'advanced_analytics' => env('ADVANCED_ANALYTICS', false),
];
