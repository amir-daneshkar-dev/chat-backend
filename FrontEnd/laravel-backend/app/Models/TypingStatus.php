<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TypingStatus extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'chat_id',
        'user_id',
        'is_typing',
        'expires_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_typing' => 'boolean',
        'expires_at' => 'datetime',
    ];

    /**
     * Get the chat that owns the typing status.
     */
    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    /**
     * Get the user that owns the typing status.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for active typing statuses.
     */
    public function scopeActive($query)
    {
        return $query->where('is_typing', true)
                    ->where('expires_at', '>', now());
    }

    /**
     * Scope for expired typing statuses.
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }
}