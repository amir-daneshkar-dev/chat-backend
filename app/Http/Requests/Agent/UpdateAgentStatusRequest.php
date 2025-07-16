<?php

namespace App\Http\Requests\Agent;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAgentStatusRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => 'required|in:available,busy,offline',
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be one of: available, busy, offline.',
        ];
    }
}
