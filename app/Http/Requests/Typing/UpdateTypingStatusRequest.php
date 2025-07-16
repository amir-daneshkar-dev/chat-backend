<?php

namespace App\Http\Requests\Typing;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTypingStatusRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'isTyping' => 'required|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'isTyping.required' => 'Typing status is required.',
            'isTyping.boolean' => 'Typing status must be true or false.',
        ];
    }
}
