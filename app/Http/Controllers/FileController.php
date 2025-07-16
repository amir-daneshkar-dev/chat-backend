<?php

namespace App\Http\Controllers;

use App\Http\Requests\File\DeleteFileRequest;
use App\Http\Requests\File\UploadFileRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileController extends Controller
{
    /**
     * Upload a file.
     */
    public function upload(UploadFileRequest $request)
    {
        $file = $request->file('file');
        $chatId = $request->chat_id;

        // Validate file type
        $allowedTypes = explode(',', config('app.allowed_file_types', 'jpg,jpeg,png,gif,pdf,doc,docx,txt,webm,mp4,mp3'));
        $extension = strtolower($file->getClientOriginalExtension());

        if (!in_array($extension, $allowedTypes)) {
            return response()->json([
                'message' => 'File type not allowed. Allowed types: ' . implode(', ', $allowedTypes)
            ], 422);
        }

        // Generate unique file_name
        $file_name = Str::uuid() . '.' . $extension;
        $path = "chat-files/{$chatId}/{$file_name}";

        // Store file
        $storedPath = Storage::disk('public')->put($path, file_get_contents($file));

        if (!$storedPath) {
            return response()->json(['message' => 'File upload failed'], 500);
        }

        $url = Storage::disk('public')->url($path);

        return response()->json([
            'url' => $url,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'path' => $storedPath,
            'success' => true,
        ]);
    }

    /**
     * Delete a file.
     */
    public function delete(DeleteFileRequest $request)
    {
        $deleted = Storage::disk('public')->delete($request->path);

        if ($deleted) {
            return response()->json(['message' => 'File deleted successfully']);
        }

        return response()->json(['message' => 'File not found'], 404);
    }

    /**
     * Get file info.
     */
    public function info(Request $request, $file_name)
    {
        $path = "chat-files/{$file_name}";

        if (!Storage::disk('public')->exists($path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $size = Storage::disk('public')->size($path);
        $lastModified = Storage::disk('public')->lastModified($path);
        $url = Storage::disk('public')->url($path);

        return response()->json([
            'file_name' => $file_name,
            'size' => $size,
            'lastModified' => date('Y-m-d H:i:s', $lastModified),
            'url' => $url,
        ]);
    }
}
