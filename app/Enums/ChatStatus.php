<?php

namespace App\Enums;

enum ChatStatus: string
{
    case WAITING = 'waiting';
    case ACTIVE = 'active';
    case CLOSED = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::WAITING => 'Waiting',
            self::ACTIVE => 'Active',
            self::CLOSED => 'Closed',
        };
    }

    public function isWaiting(): bool
    {
        return $this === self::WAITING;
    }

    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }

    public function isClosed(): bool
    {
        return $this === self::CLOSED;
    }
}
