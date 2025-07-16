<?php

namespace App\Http\Requests\Organization;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrganizationRequest extends FormRequest
{
    public function rules(): array
    {
        $organizationId = $this->route('organization')?->id ?? $this->attributes->get('organization')?->id;

        return [
            'name' => 'sometimes|string|max:255',
            'domain' => 'sometimes|string|max:255|unique:organizations,domain,' . $organizationId,
            'settings' => 'sometimes|array',
            'subscription_plan_slug' => 'sometimes|string|exists:subscription_plans,slug',
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => 'Organization name cannot exceed 255 characters.',
            'domain.max' => 'Domain cannot exceed 255 characters.',
            'domain.unique' => 'This domain is already registered.',
            'settings.array' => 'Settings must be an array.',
            'subscription_plan_slug.exists' => 'The selected subscription plan does not exist.',
        ];
    }
}
