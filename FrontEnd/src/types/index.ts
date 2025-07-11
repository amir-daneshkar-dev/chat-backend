export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
    role?: "user" | "agent" | "admin";
}

export interface Agent extends User {
    status: "available" | "busy" | "offline";
    activeChats: number;
    maxChats?: number;
    role: "agent";
}

export interface Message {
    id: string;
    chatId: string;
    userId: string;
    content: string;
    type: "text" | "file" | "voice" | "image" | "system";
    timestamp: Date;
    isRead: boolean;
    file_url?: string;
    file_name?: string;
    file_size?: number;
    voice_duration?: number;
    isAgent: boolean;
}

export interface Chat {
    id: string;
    user: User;
    agent?: Agent;
    messages: Message[];
    status: "waiting" | "active" | "closed";
    queuePosition?: number;
    createdAt: Date;
    updatedAt: Date;
    unreadCount: number;
}

export interface TypingStatus {
    chatId: string;
    userId: string;
    userName?: string;
    isTyping: boolean;
    timestamp: Date;
}

export interface ChatState {
    chats: Chat[];
    currentChat?: Chat;
    isConnected: boolean;
    typingStatuses: TypingStatus[];
}
