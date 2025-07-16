<?php

namespace App\Http\Requests\Organization;

use Illuminate\Foundation\Http\FormRequest;

class ValidateApiKeyRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'api_key' => 'required|string|size:32',
        ];
    }

    public function messages(): array
    {
        return [
            'api_key.required' => 'API key is required.',
            'api_key.size' => 'API key must be exactly 32 characters.',
        ];
    }
}
