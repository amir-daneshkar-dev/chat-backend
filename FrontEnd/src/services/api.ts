import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  mockChats,
  mockAgents,
  demoCredentials,
  addMockMessage,
  createMockChat,
  assignChatToAgent,
  markMessageAsRead as mockMarkMessageAsRead,
} from './mockData';

class ApiService {
  private api: AxiosInstance;
  private isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Always setup interceptors for real API calls
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          // Don't auto-reload in demo mode
          if (!this.isDemoMode) {
            window.location.reload();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(credentials: { email: string; password: string }) {
    if (this.isDemoMode) {
      console.log('[DEMO] Login attempt:', credentials.email);

      // Get demo credentials from environment variables
      const demoAgentEmail =
        import.meta.env.VITE_DEMO_AGENT_EMAIL || 'agent@demo.com';
      const demoAgentPassword =
        import.meta.env.VITE_DEMO_AGENT_PASSWORD || 'agent123';
      const demoUserEmail =
        import.meta.env.VITE_DEMO_USER_EMAIL || 'user@demo.com';
      const demoUserPassword =
        import.meta.env.VITE_DEMO_USER_PASSWORD || 'user123';

      // Check demo credentials
      if (
        credentials.email === demoAgentEmail &&
        credentials.password === demoAgentPassword
      ) {
        const token = 'demo-agent-token-123';
        localStorage.setItem('auth_token', token);
        return {
          token,
          user: {
            id: 'agent-1',
            name: 'Agent Smith',
            email: demoAgentEmail,
            avatar: '',
            isOnline: true,
            role: 'agent',
            status: 'available',
            activeChats: 2,
            maxChats: 5,
          },
          type: 'agent',
        };
      } else if (
        credentials.email === demoUserEmail &&
        credentials.password === demoUserPassword
      ) {
        const token = 'demo-user-token-123';
        localStorage.setItem('auth_token', token);
        return {
          token,
          user: {
            id: 'user-1',
            name: 'Demo User',
            email: demoUserEmail,
            avatar: '',
            isOnline: true,
            role: 'user',
          },
          type: 'user',
        };
      } else {
        throw new Error(
          'Invalid credentials. Please check your email and password.'
        );
      }
    }

    // Real API call to Laravel backend
    try {
      const response = await this.api.post('/api/auth/login', credentials);

      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  async logout() {
    if (this.isDemoMode) {
      console.log('[DEMO] Logout');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      return { success: true };
    }

    try {
      await this.api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  async getCurrentUser() {
    if (this.isDemoMode) {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }

    try {
      const response = await this.api.get('/api/auth/user');
      return response.data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Chat operations
  async createChat(userData: { name: string; email: string }) {
    if (this.isDemoMode) {
      console.log('[DEMO] Creating chat for:', userData);

      // Check if user already has a chat
      const existingChat = mockChats.find(
        (c) => c.user.email === userData.email && c.status !== 'closed'
      );
      if (existingChat) {
        console.log('[DEMO] Returning existing chat for user');
        return existingChat;
      }

      const chat = createMockChat(userData);

      // Simulate system message
      setTimeout(() => {
        addMockMessage(chat.id, {
          chatId: chat.id,
          userId: 'system',
          content: 'Welcome to support! An agent will be with you shortly.',
          type: 'system',
          isRead: false,
          isAgent: false,
        });
      }, 1000);

      return chat;
    }

    try {
      const response = await this.api.post('/api/chats', userData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create chat');
    }
  }

  async getChats() {
    if (this.isDemoMode) {
      console.log('[DEMO] Getting chats');
      return [...mockChats];
    }

    try {
      const response = await this.api.get('/api/chats');
      return response.data;
    } catch (error: any) {
      console.error('Get chats error:', error);
      throw new Error('Failed to load chats');
    }
  }

  async getUserChats(email: string) {
    if (this.isDemoMode) {
      console.log('[DEMO] Getting chats for user:', email);
      return mockChats.filter((c) => c.user.email === email);
    }

    try {
      const response = await this.api.get(
        `/api/chats/user/${encodeURIComponent(email)}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Get user chats error:', error);
      return [];
    }
  }

  async getChatById(chatId: string) {
    if (this.isDemoMode) {
      console.log('[DEMO] Getting chat by ID:', chatId);
      const chat = mockChats.find((c) => c.id === chatId);
      if (!chat) throw new Error('Chat not found');
      return chat;
    }

    try {
      const response = await this.api.get(`/api/chats/${chatId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Chat not found');
      }
      throw new Error('Failed to load chat');
    }
  }

  async sendMessage(
    chatId: string,
    messageData: {
      content: string;
      type: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      voiceDuration?: number;
    }
  ) {
    if (this.isDemoMode) {
      console.log('[DEMO] Sending message:', messageData);

      // Determine if this is from an agent or user
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const isAgent = currentUser.role === 'agent';

      const message = addMockMessage(chatId, {
        chatId,
        userId: currentUser.id || 'demo-user',
        content: messageData.content,
        type: messageData.type,
        fileUrl: messageData.fileUrl,
        fileName: messageData.fileName,
        fileSize: messageData.fileSize,
        voiceDuration: messageData.voiceDuration,
        isRead: false,
        isAgent,
      });

      // Simulate agent response after user message
      if (!isAgent && messageData.type === 'text') {
        setTimeout(() => {
          const responses = [
            "Thank you for your message. I'm looking into this for you.",
            'I understand your concern. Let me help you with that.',
            'Could you please provide more details about the issue?',
            "I'll check on this right away and get back to you.",
            "That's a great question. Let me find the answer for you.",
          ];
          const randomResponse =
            responses[Math.floor(Math.random() * responses.length)];

          addMockMessage(chatId, {
            chatId,
            userId: 'agent1',
            content: randomResponse,
            type: 'text',
            isRead: false,
            isAgent: true,
          });
        }, 2000 + Math.random() * 3000); // Random delay between 2-5 seconds
      }

      return message;
    }

    try {
      const response = await this.api.post(
        `/api/chats/${chatId}/messages`,
        messageData
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to send message');
    }
  }

  async markMessageAsRead(messageId: string) {
    if (this.isDemoMode) {
      console.log('[DEMO] Marking message as read:', messageId);
      mockMarkMessageAsRead(messageId);
      return { success: true };
    }

    try {
      const response = await this.api.put(`/api/messages/${messageId}/read`);
      return response.data;
    } catch (error: any) {
      console.error('Mark message as read error:', error);
      throw new Error('Failed to mark message as read');
    }
  }

  // File operations
  async uploadFile(file: File, chatId: string) {
    if (this.isDemoMode) {
      console.log('[DEMO] Uploading file:', file.name);

      // Simulate file upload with a fake URL
      const fakeUrl = `https://demo-storage.example.com/files/${Date.now()}-${
        file.name
      }`;

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            url: fakeUrl,
            fileName: file.name,
            fileSize: file.size,
            success: true,
          });
        }, 1000 + Math.random() * 2000); // Simulate upload time
      });
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chat_id', chatId);

      const response = await this.api.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to upload file');
    }
  }

  // Agent operations
  async getAgentChats() {
    if (this.isDemoMode) {
      console.log('[DEMO] Getting agent chats');
      return [...mockChats];
    }

    try {
      const response = await this.api.get('/api/agent/chats');
      return response.data;
    } catch (error: any) {
      console.error('Get agent chats error:', error);
      throw new Error('Failed to load agent chats');
    }
  }

  async assignChatToAgent(chatId: string) {
    if (this.isDemoMode) {
      console.log('[DEMO] Assigning chat to agent:', chatId);
      const currentAgent = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedChat = assignChatToAgent(chatId, currentAgent);

      if (updatedChat) {
        // Add system message about agent joining
        setTimeout(() => {
          addMockMessage(chatId, {
            chatId,
            userId: 'system',
            content: `${currentAgent.name} has joined the chat`,
            type: 'system',
            isRead: false,
            isAgent: false,
          });
        }, 500);
      }

      return updatedChat;
    }

    try {
      const response = await this.api.post(`/api/agent/chats/${chatId}/assign`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to assign chat');
    }
  }

  async updateAgentStatus(status: string) {
    if (this.isDemoMode) {
      console.log('[DEMO] Updating agent status:', status);
      const currentAgent = JSON.parse(localStorage.getItem('user') || '{}');
      currentAgent.status = status;
      localStorage.setItem('user', JSON.stringify(currentAgent));
      return { success: true, status };
    }

    try {
      const response = await this.api.put('/api/agent/status', { status });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to update agent status');
    }
  }

  async getAgentStats() {
    if (this.isDemoMode) {
      console.log('[DEMO] Getting agent stats');
      return {
        activeChats: 2,
        totalChats: 15,
        waitingChats: 3,
        closedToday: 8,
      };
    }

    try {
      const response = await this.api.get('/api/agent/stats');
      return response.data;
    } catch (error: any) {
      console.error('Get agent stats error:', error);
      throw new Error('Failed to load agent statistics');
    }
  }

  async closeChatAsAgent(chatId: string) {
    if (this.isDemoMode) {
      console.log('[DEMO] Closing chat as agent:', chatId);
      const chatIndex = mockChats.findIndex((c) => c.id === chatId);
      if (chatIndex !== -1) {
        mockChats[chatIndex].status = 'closed';
        return mockChats[chatIndex];
      }
      throw new Error('Chat not found');
    }

    try {
      const response = await this.api.post(`/api/agent/chats/${chatId}/close`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to close chat');
    }
  }

  // Typing indicators
  async sendTypingStatus(chatId: string, isTyping: boolean) {
    console.log('=== API: sendTypingStatus called ===');
    console.log('API: chatId:', chatId);
    console.log('API: isTyping:', isTyping);
    console.log('API: isDemoMode:', this.isDemoMode);

    if (this.isDemoMode) {
      console.log('[DEMO] Sending typing status:', { chatId, isTyping });
      return { success: true };
    }

    try {
      console.log(
        'API: Making POST request to:',
        `/api/chats/${chatId}/typing`
      );
      console.log('API: Request payload:', { isTyping });

      const response = await this.api.post(`/api/chats/${chatId}/typing`, {
        isTyping,
      });

      console.log('API: Typing status response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Send typing status error:', error);
      console.error('Send typing status error response:', error.response?.data);
      // Don't throw error for typing status as it's not critical
      return { success: false };
    }
  }

  async getTypingStatuses(chatId: string) {
    if (this.isDemoMode) {
      console.log('[DEMO] Getting typing statuses for chat:', chatId);
      return [];
    }

    try {
      const response = await this.api.get(`/api/chats/${chatId}/typing`);
      return response.data;
    } catch (error: any) {
      console.error('Get typing statuses error:', error);
      return [];
    }
  }
}

export default new ApiService();
