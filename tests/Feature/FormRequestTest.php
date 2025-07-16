<?php

namespace Tests\Feature;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Organization\RegisterOrganizationRequest;
use App\Http\Requests\Message\CreateMessageRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FormRequestTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that login validation works correctly.
     */
    public function test_login_validation_works(): void
    {
        $request = new LoginRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('email', $rules);
        $this->assertArrayHasKey('password', $rules);
        $this->assertEquals('required|email', $rules['email']);
        $this->assertEquals('required', $rules['password']);
    }

    /**
     * Test that register validation works correctly.
     */
    public function test_register_validation_works(): void
    {
        $request = new RegisterRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('name', $rules);
        $this->assertArrayHasKey('email', $rules);
        $this->assertArrayHasKey('password', $rules);
        $this->assertEquals('required|string|max:255', $rules['name']);
        $this->assertEquals('required|string|email|max:255|unique:users', $rules['email']);
        $this->assertEquals('required|string|min:8|confirmed', $rules['password']);
    }

    /**
     * Test that organization registration validation works correctly.
     */
    public function test_organization_register_validation_works(): void
    {
        $request = new RegisterOrganizationRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('name', $rules);
        $this->assertArrayHasKey('domain', $rules);
        $this->assertArrayHasKey('subscription_plan_slug', $rules);
        $this->assertEquals('required|string|max:255', $rules['name']);
        $this->assertEquals('nullable|string|max:255|unique:organizations,domain', $rules['domain']);
        $this->assertEquals('nullable|string|exists:subscription_plans,slug', $rules['subscription_plan_slug']);
    }

    /**
     * Test that message creation validation works correctly.
     */
    public function test_message_creation_validation_works(): void
    {
        $request = new CreateMessageRequest();
        $rules = $request->rules();

        $this->assertArrayHasKey('content', $rules);
        $this->assertArrayHasKey('type', $rules);
        $this->assertEquals('required|string', $rules['content']);
        $this->assertEquals('sometimes|in:text,file,image,voice,system', $rules['type']);
    }
}
