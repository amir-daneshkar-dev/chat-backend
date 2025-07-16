<?php

namespace App\Http\Requests\File;

use Illuminate\Foundation\Http\FormRequest;

class DeleteFileRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'path' => 'required|string',
        ];
    }

    public function messages(): array
    {
        return [
            'path.required' => 'File path is required.',
        ];
    }
}
