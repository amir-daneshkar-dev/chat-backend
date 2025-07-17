<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

        // Enhanced origin validation
        if (!$this->validateOrigin($request, $organization)) {
            // Log suspicious activity
            Log::warning('Invalid origin detected', [
                'organization_id' => $organization->id,
                'organization_domain' => $organization->domain,
                'request_origin' => $request->header('Origin'),
                'request_referer' => $request->header('Referer'),
                'request_host' => $request->header('Host'),
                'ip_address' => $request->ip(),
                'user_agent' => $request->header('User-Agent'),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid origin',
            ], 403);
        }

        // Set organization in request for later use
        $request->attributes->set('organization', $organization);
        $request->attributes->set('organization_id', $organization->id);

        return $next($request);
    }

    /**
     * Validate the request origin against the organization domain
     */
    private function validateOrigin(Request $request, Organization $organization): bool
    {
        // If no domain is set for the organization, skip validation
        if (empty($organization->domain)) {
            return true;
        }

        $origin = $request->header('Origin');
        $referer = $request->header('Referer');
        $host = $request->header('Host');

        // Check if any of the headers match the organization domain
        return $this->isValidOrigin($origin, $organization->domain) ||
            $this->isValidOrigin($referer, $organization->domain) ||
            $this->isValidOrigin($host, $organization->domain);
    }

    /**
     * Check if the origin is valid for the given domain
     */
    private function isValidOrigin(?string $origin, string $domain): bool
    {
        if (empty($origin)) {
            return false;
        }

        // Normalize the stored domain (remove protocol if present)
        $normalizedDomain = $this->normalizeDomain($domain);

        // Normalize the request origin
        $normalizedOrigin = $this->normalizeDomain($origin);

        // Check exact match
        if ($normalizedOrigin === $normalizedDomain) {
            return true;
        }

        // Check subdomain match (e.g., api.example.com should match example.com)
        if (str_ends_with($normalizedOrigin, '.' . $normalizedDomain)) {
            return true;
        }

        // Check wildcard subdomain (if domain starts with *)
        if (str_starts_with($normalizedDomain, '*.')) {
            $baseDomain = substr($normalizedDomain, 2);
            if (str_ends_with($normalizedOrigin, '.' . $baseDomain) || $normalizedOrigin === $baseDomain) {
                return true;
            }
        }

        return false;
    }

    /**
     * Normalize a domain by removing protocol, port, and path
     */
    private function normalizeDomain(string $domain): string
    {
        // Remove protocol (http://, https://, etc.)
        $domain = preg_replace('/^https?:\/\//', '', $domain);

        // Remove port if present
        $domain = preg_replace('/:\d+$/', '', $domain);

        // Remove path if present
        $domain = parse_url($domain, PHP_URL_HOST) ?? $domain;

        // Remove trailing slash if present
        $domain = rtrim($domain, '/');

        return strtolower($domain);
    }
}
