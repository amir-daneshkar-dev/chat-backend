<?php

namespace App\Enums;

enum AgentStatus: string
{
    case AVAILABLE = 'available';
    case BUSY = 'busy';
    case OFFLINE = 'offline';

    public function label(): string
    {
        return match ($this) {
            self::AVAILABLE => 'Available',
            self::BUSY => 'Busy',
            self::OFFLINE => 'Offline',
        };
    }

    public function isAvailable(): bool
    {
        return $this === self::AVAILABLE;
    }

    public function canAcceptChats(): bool
    {
        return $this === self::AVAILABLE;
    }
}
