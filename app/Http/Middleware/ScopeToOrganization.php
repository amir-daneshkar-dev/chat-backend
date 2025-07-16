<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ScopeToOrganization
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
            ], 401);
        }

        // For API key authenticated requests, use the organization from the request
        if ($request->attributes->has('organization_id')) {
            $organizationId = $request->attributes->get('organization_id');
        } else {
            // For authenticated users, use their organization
            $organizationId = $user->organization_id;
        }

        if (!$organizationId) {
            return response()->json([
                'success' => false,
                'message' => 'User does not belong to any organization',
            ], 403);
        }

        // Set organization context for the request
        $request->attributes->set('organization_id', $organizationId);

        return $next($request);
    }
}
