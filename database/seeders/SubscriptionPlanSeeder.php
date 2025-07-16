<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'description' => 'Perfect for small teams getting started with chat support',
                'monthly_price' => 29.99,
                'yearly_price' => 299.99,
                'max_agents' => 5,
                'max_chats_per_agent' => 3,
                'features' => [
                    'chat_widget',
                    'basic_analytics',
                    'email_notifications',
                ],
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Premium',
                'slug' => 'premium',
                'description' => 'Advanced features for growing support teams',
                'monthly_price' => 79.99,
                'yearly_price' => 799.99,
                'max_agents' => 15,
                'max_chats_per_agent' => 5,
                'features' => [
                    'chat_widget',
                    'advanced_analytics',
                    'email_notifications',
                    'custom_widget_styling',
                    'chat_transcripts',
                    'agent_performance_reports',
                ],
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Full-featured solution for large organizations',
                'monthly_price' => 199.99,
                'yearly_price' => 1999.99,
                'max_agents' => 50,
                'max_chats_per_agent' => 10,
                'features' => [
                    'chat_widget',
                    'advanced_analytics',
                    'email_notifications',
                    'chat_transcripts',
                    'agent_performance_reports',
                    'custom_integrations',
                    'dedicated_account_manager',
                    'sla_guarantees',
                    'white_label_options',
                ],
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }
}
