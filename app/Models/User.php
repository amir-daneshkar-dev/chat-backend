<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Enums\UserRole;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Relations\UserRelationsTrait;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, UserRelationsTrait;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar',
        'is_online',
        'last_seen_at',
        'organization_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'is_online' => 'boolean',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    /**
     * Check if user is an agent.
     */
    public function isAgent(): bool
    {
        return $this->role->isAgent();
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role->isAdmin();
    }

    /**
     * Update user's online status.
     */
    public function updateOnlineStatus(bool $isOnline): void
    {
        $this->update([
            'is_online' => $isOnline,
            'last_seen_at' => now(),
        ]);
    }

    /**
     * Get the organization that the user belongs to.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Check if user belongs to a specific organization.
     */
    public function belongsToOrganization(int $organizationId): bool
    {
        return $this->organization_id === $organizationId;
    }
}
