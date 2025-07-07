import { User, Agent, Chat, Message } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '',
    isOnline: true
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: '',
    isOnline: true
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    avatar: '',
    isOnline: false
  }
];

// Mock Agents
export const mockAgents: Agent[] = [
  {
    id: 'agent1',
    name: 'Agent Smith',
    email: 'agent@example.com',
    avatar: '',
    isOnline: true,
    status: 'available',
    activeChats: 2
  },
  {
    id: 'agent2',
    name: 'Agent Johnson',
    email: 'agent2@example.com',
    avatar: '',
    isOnline: true,
    status: 'busy',
    activeChats: 5
  }
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: 'msg1',
    chatId: 'chat1',
    userId: '1',
    content: 'Hello, I need help with my account',
    type: 'text',
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    isRead: true,
    isAgent: false
  },
  {
    id: 'msg2',
    chatId: 'chat1',
    userId: 'agent1',
    content: 'Hi John! I\'d be happy to help you with your account. What specific issue are you experiencing?',
    type: 'text',
    timestamp: new Date(Date.now() - 240000), // 4 minutes ago
    isRead: true,
    isAgent: true
  },
  {
    id: 'msg3',
    chatId: 'chat1',
    userId: '1',
    content: 'I can\'t log into my account. It says my password is incorrect.',
    type: 'text',
    timestamp: new Date(Date.now() - 180000), // 3 minutes ago
    isRead: true,
    isAgent: false
  },
  {
    id: 'msg4',
    chatId: 'chat2',
    userId: '2',
    content: 'Hi, I have a question about billing',
    type: 'text',
    timestamp: new Date(Date.now() - 120000), // 2 minutes ago
    isRead: false,
    isAgent: false
  },
  {
    id: 'msg5',
    chatId: 'chat3',
    userId: '3',
    content: 'Is anyone available to help?',
    type: 'text',
    timestamp: new Date(Date.now() - 60000), // 1 minute ago
    isRead: false,
    isAgent: false
  }
];

// Mock Chats
export const mockChats: Chat[] = [
  {
    id: 'chat1',
    user: mockUsers[0],
    agent: mockAgents[0],
    messages: mockMessages.filter(m => m.chatId === 'chat1'),
    status: 'active',
    createdAt: new Date(Date.now() - 600000), // 10 minutes ago
    updatedAt: new Date(Date.now() - 180000), // 3 minutes ago
    unreadCount: 0
  },
  {
    id: 'chat2',
    user: mockUsers[1],
    messages: mockMessages.filter(m => m.chatId === 'chat2'),
    status: 'waiting',
    queuePosition: 1,
    createdAt: new Date(Date.now() - 300000), // 5 minutes ago
    updatedAt: new Date(Date.now() - 120000), // 2 minutes ago
    unreadCount: 1
  },
  {
    id: 'chat3',
    user: mockUsers[2],
    messages: mockMessages.filter(m => m.chatId === 'chat3'),
    status: 'waiting',
    queuePosition: 2,
    createdAt: new Date(Date.now() - 120000), // 2 minutes ago
    updatedAt: new Date(Date.now() - 60000), // 1 minute ago
    unreadCount: 1
  }
];

// Demo credentials
export const demoCredentials = {
  agent: {
    email: 'agent@example.com',
    password: 'password',
    user: mockAgents[0]
  },
  user: {
    email: 'user@example.com',
    password: 'password',
    user: mockUsers[0]
  }
};

// Helper functions for mock data manipulation
export const addMockMessage = (chatId: string, message: Omit<Message, 'id' | 'timestamp'>): Message => {
  const newMessage: Message = {
    ...message,
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date()
  };
  
  mockMessages.push(newMessage);
  
  // Update chat's messages and updatedAt
  const chatIndex = mockChats.findIndex(c => c.id === chatId);
  if (chatIndex !== -1) {
    mockChats[chatIndex].messages.push(newMessage);
    mockChats[chatIndex].updatedAt = new Date();
    if (!message.isAgent) {
      mockChats[chatIndex].unreadCount++;
    }
  }
  
  return newMessage;
};

export const createMockChat = (userData: { name: string; email: string }): Chat => {
  const newUser: User = {
    id: `user_${Date.now()}`,
    name: userData.name,
    email: userData.email,
    avatar: '',
    isOnline: true
  };
  
  const newChat: Chat = {
    id: `chat_${Date.now()}`,
    user: newUser,
    messages: [],
    status: 'waiting',
    queuePosition: mockChats.filter(c => c.status === 'waiting').length + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    unreadCount: 0
  };
  
  mockChats.unshift(newChat);
  mockUsers.push(newUser);
  
  return newChat;
};

export const assignChatToAgent = (chatId: string, agent: Agent): Chat | null => {
  const chatIndex = mockChats.findIndex(c => c.id === chatId);
  if (chatIndex !== -1) {
    mockChats[chatIndex].agent = agent;
    mockChats[chatIndex].status = 'active';
    mockChats[chatIndex].queuePosition = undefined;
    mockChats[chatIndex].updatedAt = new Date();
    return mockChats[chatIndex];
  }
  return null;
};

export const markMessageAsRead = (messageId: string): boolean => {
  const messageIndex = mockMessages.findIndex(m => m.id === messageId);
  if (messageIndex !== -1) {
    mockMessages[messageIndex].isRead = true;
    return true;
  }
  return false;
};