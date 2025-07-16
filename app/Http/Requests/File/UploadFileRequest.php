<?php

namespace App\Http\Requests\File;

use Illuminate\Foundation\Http\FormRequest;

class UploadFileRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'file' => 'required|file|max:' . (config('app.max_file_size', 10240)), // Default 10MB
            'chat_id' => 'required|string',
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'File is required.',
            'file.file' => 'The uploaded file is invalid.',
            'file.max' => 'File size cannot exceed ' . (config('app.max_file_size', 10240) / 1024) . 'MB.',
            'chat_id.required' => 'Chat ID is required.',
        ];
    }
}
