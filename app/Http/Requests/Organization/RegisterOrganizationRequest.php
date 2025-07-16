<?php

namespace App\Http\Requests\Organization;

use Illuminate\Foundation\Http\FormRequest;

class RegisterOrganizationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'domain' => 'nullable|string|max:255|unique:organizations,domain',
            'subscription_plan_slug' => 'nullable|string|exists:subscription_plans,slug',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Organization name is required.',
            'name.max' => 'Organization name cannot exceed 255 characters.',
            'domain.max' => 'Domain cannot exceed 255 characters.',
            'domain.unique' => 'This domain is already registered.',
            'subscription_plan_slug.exists' => 'The selected subscription plan does not exist.',
        ];
    }
}
