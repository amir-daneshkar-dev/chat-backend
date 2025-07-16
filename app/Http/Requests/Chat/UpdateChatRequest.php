<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChatRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => 'sometimes|in:waiting,active,closed',
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'Status must be one of: waiting, active, closed.',
        ];
    }
}
