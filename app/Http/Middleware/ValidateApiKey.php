<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateApiKey
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-API-Key') ?? $request->input('api_key');

        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'API key is required',
            ], 401);
        }

        $organization = Organization::where('api_key', $apiKey)->first();

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

        // Set organization in request for later use
        $request->attributes->set('organization', $organization);
        $request->attributes->set('organization_id', $organization->id);

        return $next($request);
    }
}
