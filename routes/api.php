<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\TypingController;
use App\Http\Controllers\OrganizationController;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Organization management routes
Route::post('/organizations/register', [OrganizationController::class, 'register']);
Route::post('/organizations/validate-api-key', [OrganizationController::class, 'validateApiKey']);
Route::get('/subscription-plans', [OrganizationController::class, 'getSubscriptionPlans']);

// API key protected routes (for chat widget)
Route::middleware('validate.api.key')->group(function () {
    Route::get('/chats/user/{email}', [ChatController::class, 'getUserChats']);
    Route::post('/chats', [ChatController::class, 'store']);
});

// Protected routes
Route::middleware(['auth:sanctum', 'scope.organization'])->group(function () {
    // Authentication
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);

    // Organization management
    Route::prefix('organizations')->group(function () {
        Route::get('/', [OrganizationController::class, 'show']);
        Route::put('/', [OrganizationController::class, 'update']);
        Route::post('/regenerate-api-key', [OrganizationController::class, 'regenerateApiKey']);
        Route::get('/stats', [OrganizationController::class, 'stats']);
    });

    // Chats
    Route::get('/chats', [ChatController::class, 'index']);
    Route::get('/chats/{chatId}', [ChatController::class, 'show']);
    Route::put('/chats/{chatId}', [ChatController::class, 'update']);
    Route::delete('/chats/{chatId}', [ChatController::class, 'destroy']);

    // Messages
    Route::get('/chats/{chatId}/messages', [MessageController::class, 'index']);
    Route::post('/chats/{chatId}/messages', [MessageController::class, 'store']);
    Route::put('/messages/{messageId}/read', [MessageController::class, 'markAsRead']);

    // File uploads
    Route::post('/files/upload', [FileController::class, 'upload']);
    Route::delete('/files', [FileController::class, 'delete']);
    Route::get('/files/{file_name}/info', [FileController::class, 'info']);

    // Typing indicators
    Route::post('/chats/{chatId}/typing', [TypingController::class, 'updateTypingStatus']);
    Route::get('/chats/{chatId}/typing', [TypingController::class, 'getTypingStatuses']);

    // Agent-specific routes
    Route::prefix('agent')->middleware('agent')->group(function () {
        Route::get('/chats', [AgentController::class, 'getChats']);
        Route::post('/chats/{chatId}/assign', [AgentController::class, 'assignChat']);
        Route::post('/chats/{chatId}/close', [AgentController::class, 'closeChat']);
        Route::put('/status', [AgentController::class, 'updateStatus']);
        Route::get('/stats', [AgentController::class, 'getStats']);
    });
});

// Admin routes (if needed)
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Admin-specific routes can be added here
});

// Utility routes
Route::get('/typing/cleanup', [TypingController::class, 'cleanupExpired']);
