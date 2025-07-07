import { Chat, Message, Agent, User } from '../types';

// Demo users
export const demoUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '',
    isOnline: true
  },
  {
    id: 'user-2',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    avatar: '',
    isOnline: true
  },
  {
    id: 'user-3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    avatar: '',
    isOnline: false
  }
];

// Demo agents
export const demoAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Agent Smith',
    email: 'agent@demo.com',
    avatar: '',
    isOnline: true,
    status: 'available',
    activeChats: 2
  },
  {
    id: 'agent-2',
    name: 'Agent Johnson',
    email: 'agent2@demo.com',
    avatar: '',
    isOnline: true,
    status: 'busy',
    activeChats: 5
  }
];

// Demo messages
export const demoMessages: Message[] = [
  {
    id: 'msg-1',
    chatId: 'chat-1',
    userId: 'user-1',
    content: 'Hello, I need help with my order',
    type: 'text',
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    isRead: true,
    isAgent: false
  },
  {
    id: 'msg-2',
    chatId: 'chat-1',
    userId: 'agent-1',
    content: 'Hi John! I\'d be happy to help you with your order. Can you please provide your order number?',
    type: 'text',
    timestamp: new Date(Date.now() - 240000), // 4 minutes ago
    isRead: true,
    isAgent: true
  },
  {
    id: 'msg-3',
    chatId: 'chat-1',
    userId: 'user-1',
    content: 'Sure, it\'s #12345',
    type: 'text',
    timestamp: new Date(Date.now() - 180000), // 3 minutes ago
    isRead: true,
    isAgent: false
  },
  {
    id: 'msg-4',
    chatId: 'chat-2',
    userId: 'user-2',
    content: 'I\'m having trouble logging into my account',
    type: 'text',
    timestamp: new Date(Date.now() - 120000), // 2 minutes ago
    isRead: false,
    isAgent: false
  },
  {
    id: 'msg-5',
    chatId: 'chat-3',
    userId: 'user-3',
    content: 'Can you help me with billing?',
    type: 'text',
    timestamp: new Date(Date.now() - 60000), // 1 minute ago
    isRead: false,
    isAgent: false
  }
];

// Demo chats
export const demoChats: Chat[] = [
  {
    id: 'chat-1',
    user: demoUsers[0],
    agent: demoAgents[0],
    messages: demoMessages.filter(m => m.chatId === 'chat-1'),
    status: 'active',
    createdAt: new Date(Date.now() - 600000), // 10 minutes ago
    updatedAt: new Date(Date.now() - 180000), // 3 minutes ago
    unreadCount: 0
  },
  {
    id: 'chat-2',
    user: demoUsers[1],
    messages: demoMessages.filter(m => m.chatId === 'chat-2'),
    status: 'waiting',
    queuePosition: 1,
    createdAt: new Date(Date.now() - 300000), // 5 minutes ago
    updatedAt: new Date(Date.now() - 120000), // 2 minutes ago
    unreadCount: 1
  },
  {
    id: 'chat-3',
    user: demoUsers[2],
    messages: demoMessages.filter(m => m.chatId === 'chat-3'),
    status: 'waiting',
    queuePosition: 2,
    createdAt: new Date(Date.now() - 180000), // 3 minutes ago
    updatedAt: new Date(Date.now() - 60000), // 1 minute ago
    unreadCount: 1
  }
];

// Demo responses for auto-reply
export const demoAutoResponses = [
  "Thank you for your message! I'm looking into that for you.",
  "I understand your concern. Let me check our system.",
  "That's a great question! Here's what I can tell you...",
  "I'll need to verify some information. One moment please.",
  "Thanks for providing that information. Let me process this.",
  "I see the issue now. Here's how we can resolve it:",
  "That should be all set! Is there anything else I can help you with?",
  "I've updated your account. You should see the changes shortly.",
  "Perfect! Your request has been processed successfully.",
  "I'm escalating this to our technical team for further assistance."
];

export const generateDemoMessage = (chatId: string, content: string, isAgent: boolean = false): Message => {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    chatId,
    userId: isAgent ? 'agent-1' : 'user-demo',
    content,
    type: 'text',
    timestamp: new Date(),
    isRead: false,
    isAgent
  };
};

export const getRandomAutoResponse = (): string => {
  return demoAutoResponses[Math.floor(Math.random() * demoAutoResponses.length)];
};