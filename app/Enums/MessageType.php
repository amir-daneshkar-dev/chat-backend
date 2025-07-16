<?php

namespace App\Enums;

enum MessageType: string
{
    case TEXT = 'text';
    case FILE = 'file';
    case IMAGE = 'image';
    case VOICE = 'voice';
    case SYSTEM = 'system';

    public function label(): string
    {
        return match ($this) {
            self::TEXT => 'Text',
            self::FILE => 'File',
            self::IMAGE => 'Image',
            self::VOICE => 'Voice',
            self::SYSTEM => 'System',
        };
    }

    public function isSystem(): bool
    {
        return $this === self::SYSTEM;
    }

    public function isFile(): bool
    {
        return in_array($this, [self::FILE, self::IMAGE, self::VOICE]);
    }
}
