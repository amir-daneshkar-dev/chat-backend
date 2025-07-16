<?php

namespace App\Enums;

enum UserRole: string
{
    case USER = 'user';
    case AGENT = 'agent';
    case ADMIN = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::USER => 'User',
            self::AGENT => 'Agent',
            self::ADMIN => 'Admin',
        };
    }

    public function isAgent(): bool
    {
        return $this === self::AGENT;
    }

    public function isAdmin(): bool
    {
        return $this === self::ADMIN;
    }

    public function isUser(): bool
    {
        return $this === self::USER;
    }
}
