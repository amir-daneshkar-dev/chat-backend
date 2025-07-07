import { Chat, Message, Agent, User } from '../types';
import { demoChats, demoAgents, demoUsers, generateDemoMessage, getRandomAutoResponse } from './demoData';

class DemoApiService {
  private chats: Chat[] = [...demoChats];
  private currentUser: User | Agent | null = null;

  // Simulate network delay
  private delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Authentication
  async login(credentials: { email: string; password: string }) {
    await this.delay(800);
    
    const { email, password } = credentials;
    
    // Check demo credentials
    if (email === import.meta.env.VITE_DEMO_AGENT_EMAIL && password === import.meta.env.VITE_DEMO_AGENT_PASSWORD) {
      this.currentUser = demoAgents[0];
      return {
        token: 'demo-agent-token',
        user: this.currentUser
      };
    }
    
    if (email === import.meta.env.VITE_DEMO_USER_EMAIL && password === import.meta.env.VITE_DEMO_USER_PASSWORD) {
      this.currentUser = demoUsers[0];
      return {
        token: 'demo-user-token',
        user: this.currentUser
      };
    }
    
    throw new Error('Invalid credentials');
  }

  async logout() {
    await this.delay(300);
    this.currentUser = null;
  }

  // Chat operations
  async createChat(userData: { name: string; email: string }) {
    await this.delay(600);
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      avatar: '',
      isOnline: true
    };

    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      user: newUser,
      messages: [],
      status: 'waiting',
      queuePosition: this.chats.filter(c => c.status === 'waiting').length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      unreadCount: 0
    };

    this.chats.unshift(newChat);
    
    // Simulate system message
    setTimeout(() => {
      const systemMessage = generateDemoMessage(
        newChat.id,
        'Welcome! You are now in the support queue. An agent will be with you shortly.',
        false
      );
      systemMessage.type = 'system';
      newChat.messages.push(systemMessage);
    }, 1000);

    return newChat;
  }

  async getChats() {
    await this.delay(400);
    return this.chats;
  }

  async getChatById(chatId: string) {
    await this.delay(300);
    const chat = this.chats.find(c => c.id === chatId);
    if (!chat) throw new Error('Chat not found');
    return chat;
  }

  async sendMessage(chatId: string, messageData: {
    content: string;
    type: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    voiceDuration?: number;
  }) {
    await this.delay(400);
    
    const chat = this.chats.find(c => c.id === chatId);
    if (!chat) throw new Error('Chat not found');

    const isAgent = this.currentUser && 'status' in this.currentUser;
    
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      userId: this.currentUser?.id || 'demo-user',
      content: messageData.content,
      type: messageData.type as any,
      timestamp: new Date(),
      isRead: false,
      isAgent,
      fileUrl: messageData.fileUrl,
      fileName: messageData.fileName,
      fileSize: messageData.fileSize,
      voiceDuration: messageData.voiceDuration
    };

    chat.messages.push(message);
    chat.updatedAt = new Date();

    // Simulate agent auto-response (only if user sent the message)
    if (!isAgent && messageData.type === 'text') {
      setTimeout(() => {
        const autoResponse = generateDemoMessage(
          chatId,
          getRandomAutoResponse(),
          true
        );
        chat.messages.push(autoResponse);
        chat.updatedAt = new Date();
        
        // Assign agent if chat was waiting
        if (chat.status === 'waiting') {
          chat.status = 'active';
          chat.agent = demoAgents[0];
          chat.queuePosition = undefined;
        }
      }, 1500 + Math.random() * 2000); // Random delay 1.5-3.5s
    }

    return message;
  }

  async markMessageAsRead(messageId: string) {
    await this.delay(200);
    
    for (const chat of this.chats) {
      const message = chat.messages.find(m => m.id === messageId);
      if (message) {
        message.isRead = true;
        break;
      }
    }
  }

  // File operations
  async uploadFile(file: File, chatId: string) {
    await this.delay(1000 + Math.random() * 2000); // Simulate upload time
    
    // Create a fake URL for demo
    const fakeUrl = `https://demo-storage.example.com/files/${Date.now()}-${file.name}`;
    
    return {
      url: fakeUrl,
      fileName: file.name,
      fileSize: file.size
    };
  }

  // Agent operations
  async getAgentChats() {
    await this.delay(500);
    return this.chats;
  }

  async assignChatToAgent(chatId: string) {
    await this.delay(400);
    
    const chat = this.chats.find(c => c.id === chatId);
    if (!chat) throw new Error('Chat not found');
    
    chat.status = 'active';
    chat.agent = this.currentUser as Agent;
    chat.queuePosition = undefined;
    
    return chat;
  }

  async updateAgentStatus(status: string) {
    await this.delay(300);
    
    if (this.currentUser && 'status' in this.currentUser) {
      (this.currentUser as Agent).status = status as any;
    }
  }

  // Typing indicators
  async sendTypingStatus(chatId: string, isTyping: boolean) {
    await this.delay(100);
    // In demo mode, we just acknowledge the typing status
    return { success: true };
  }
}

export default new DemoApiService();