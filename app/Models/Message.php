<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Models\Relations\MessageRelationsTrait;

class Message extends Model
{
    use HasFactory, MessageRelationsTrait;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'uuid',
        'chat_id',
        'user_id',
        'content',
        'type',
        'file_url',
        'file_name',
        'file_size',
        'voice_duration',
        'is_read',
        'read_at',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'file_size' => 'integer',
        'voice_duration' => 'integer',
        'metadata' => 'array',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($message) {
            if (empty($message->uuid)) {
                $message->uuid = Str::uuid();
            }
        });
    }


    /**
     * Check if message is from an agent.
     */
    public function getIsAgentAttribute(): bool
    {
        return $this->user && $this->user->isAgent();
    }

    /**
     * Mark message as read.
     */
    public function markAsRead(): void
    {
        if (!$this->is_read) {
            $this->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }
    }

    /**
     * Scope for unread messages.
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope for read messages.
     */
    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    /**
     * Scope for messages by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
