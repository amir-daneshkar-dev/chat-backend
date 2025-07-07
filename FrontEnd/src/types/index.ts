export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
}

export interface Agent extends User {
  status: 'available' | 'busy' | 'offline';
  activeChats: number;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  type: 'text' | 'file' | 'voice' | 'image' | 'system';
  timestamp: Date;
  isRead: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  voiceDuration?: number;
  isAgent: boolean;
}

export interface Chat {
  id: string;
  user: User;
  agent?: Agent;
  messages: Message[];
  status: 'waiting' | 'active' | 'closed';
  queuePosition?: number;
  createdAt: Date;
  updatedAt: Date;
  unreadCount: number;
}

export interface TypingStatus {
  chatId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface ChatState {
  chats: Chat[];
  currentChat?: Chat;
  isConnected: boolean;
  typingStatuses: TypingStatus[];
}