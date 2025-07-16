<?php

namespace App\Http\Controllers;

use App\Enums\OrganizationStatus;
use App\Http\Requests\Organization\RegisterOrganizationRequest;
use App\Http\Requests\Organization\UpdateOrganizationRequest;
use App\Http\Requests\Organization\ValidateApiKeyRequest;
use App\Models\Organization;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class OrganizationController extends Controller
{
    /**
     * Register a new organization.
     */
    public function register(RegisterOrganizationRequest $request): JsonResponse
    {
        $subscriptionPlan = null;
        if ($request->subscription_plan_slug) {
            $subscriptionPlan = SubscriptionPlan::where('slug', $request->subscription_plan_slug)->first();
        }

        // Remove automatic fallback to basic plan - organizations can exist without a plan
        // if (!$subscriptionPlan) {
        //     $subscriptionPlan = SubscriptionPlan::where('slug', 'basic')->first();
        // }

        $organization = Organization::create([
            'name' => $request->name,
            'domain' => $request->domain,
            'api_key' => Str::random(32),
            'status' => OrganizationStatus::ACTIVE,
            'subscription_plan_id' => $subscriptionPlan?->id,
            'settings' => [
                'chat_widget_enabled' => true,
                'max_agents' => $subscriptionPlan?->max_agents ?? config('subscription_plan.max_agents'),
                'max_chats_per_agent' => $subscriptionPlan?->max_chats_per_agent ?? config('subscription_plan.max_chats_per_agent'),
                'advanced_analytics' => $subscriptionPlan?->hasFeature('advanced_analytics') ?? config('subscription_plan.advanced_analytics'),
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Organization registered successfully',
            'data' => [
                'organization' => $organization->load('subscriptionPlan'),
                'api_key' => $organization->api_key,
            ]
        ], 201);
    }

    /**
     * Validate API key and return organization info.
     */
    public function validateApiKey(ValidateApiKeyRequest $request): JsonResponse
    {
        $organization = Organization::where('api_key', $request->api_key)->first();

        if (!$organization) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid API key',
            ], 401);
        }

        if (!$organization->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Organization is not active',
            ], 403);
        }

        if (!$organization->hasValidSubscription()) {
            return response()->json([
                'success' => false,
                'message' => 'Organization subscription has expired',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'API key is valid',
            'data' => [
                'organization_id' => $organization->id,
                'organization_name' => $organization->name,
                'settings' => $organization->settings,
            ]
        ]);
    }

    /**
     * Get organization details.
     */
    public function show(Request $request): JsonResponse
    {
        $organization = $request->attributes->get('organization');

        return response()->json([
            'success' => true,
            'data' => $organization->load('subscriptionPlan')
        ]);
    }

    /**
     * Update organization.
     */
    public function update(UpdateOrganizationRequest $request): JsonResponse
    {
        $organization = $request->attributes->get('organization');

        $updateData = $request->only(['name', 'domain', 'settings']);

        // Handle subscription plan update
        if ($request->subscription_plan_slug) {
            $subscriptionPlan = SubscriptionPlan::where('slug', $request->subscription_plan_slug)->first();
            if ($subscriptionPlan) {
                $updateData['subscription_plan_id'] = $subscriptionPlan->id;

                // Update settings based on new plan
                $updateData['settings'] = array_merge($organization->settings ?? [], [
                    'max_agents' => $subscriptionPlan->max_agents,
                    'max_chats_per_agent' => $subscriptionPlan->max_chats_per_agent,
                    'advanced_analytics' => $subscriptionPlan->hasFeature('advanced_analytics'),
                ]);
            }
        }

        $organization->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Organization updated successfully',
            'data' => $organization->load('subscriptionPlan')
        ]);
    }

    /**
     * Regenerate API key.
     */
    public function regenerateApiKey(Request $request): JsonResponse
    {
        $organization = $request->attributes->get('organization');
        $organization->regenerateApiKey();

        return response()->json([
            'success' => true,
            'message' => 'API key regenerated successfully',
            'data' => [
                'api_key' => $organization->api_key
            ]
        ]);
    }

    /**
     * Get organization statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $organization = $request->user()->organization;

        if (!$organization) {
            return response()->json([
                'success' => false,
                'message' => 'Organization not found',
            ], 404);
        }

        $stats = [
            'total_users' => $organization->users()->count(),
            'total_agents' => $organization->agents()->count(),
            'total_chats' => $organization->chats()->count(),
            'active_chats' => $organization->chats()->where('status', 'active')->count(),
            'waiting_chats' => $organization->chats()->where('status', 'waiting')->count(),
            'closed_chats' => $organization->chats()->where('status', 'closed')->count(),
            'total_messages' => $organization->chats()->withCount('messages')->get()->sum('messages_count'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get available subscription plans.
     */
    public function getSubscriptionPlans(): JsonResponse
    {
        $plans = SubscriptionPlan::active()->ordered()->get();

        return response()->json([
            'success' => true,
            'data' => $plans
        ]);
    }
}
