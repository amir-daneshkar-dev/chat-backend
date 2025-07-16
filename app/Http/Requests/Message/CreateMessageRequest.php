<?php

namespace App\Http\Requests\Message;

use Illuminate\Foundation\Http\FormRequest;

class CreateMessageRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'content' => 'required|string',
            'type' => 'sometimes|in:text,file,image,voice,system',
            'file_url' => 'sometimes|url',
            'file_name' => 'sometimes|string',
            'file_size' => 'sometimes|integer',
            'voice_duration' => 'sometimes|integer',
        ];
    }

    public function messages(): array
    {
        return [
            'content.required' => 'Message content is required.',
            'type.in' => 'Message type must be one of: text, file, image, voice, system.',
            'file_url.url' => 'File URL must be a valid URL.',
            'file_size.integer' => 'File size must be a number.',
            'voice_duration.integer' => 'Voice duration must be a number.',
        ];
    }
}
