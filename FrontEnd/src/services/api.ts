import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  mockChats, 
  mockAgents, 
  demoCredentials, 
  addMockMessage, 
  createMockChat, 
  assignChatToAgent, 
  markMessageAsRead as mockMarkMessageAsRead 
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
        'Accept': 'application/json',
      },
    });

    if (!this.isDemoMode) {
      this.setupInterceptors();
    }
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
          window.location.reload();
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
      const demoAgentEmail = import.meta.env.VITE_DEMO_AGENT_EMAIL || 'agent@demo.com';
      const demoAgentPassword = import.meta.env.VITE_DEMO_AGENT_PASSWORD || 'agent123';
      const demoUserEmail = import.meta.env.VITE_DEMO_USER_EMAIL || 'user@demo.com';
      const demoUserPassword = import.meta.env.VITE_DEMO_USER_PASSWORD || 'user123';
      
      // Check demo credentials
      if (credentials.email === demoAgentEmail && credentials.password === demoAgentPassword) {
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
            status: 'available',
            activeChats: 2
          },
          type: 'agent'
        };
      } else if (credentials.email === demoUserEmail && credentials.password === demoUserPassword) {
        const token = 'demo-user-token-123';
        localStorage.setItem('auth_token', token);
        return {
          token,
          user: {
            id: 'user-1',
            name: 'Demo User',
            email: demoUserEmail,
            avatar: '',
            isOnline: true
          },
          type: 'user'
        };
      } else {
        throw new Error('Invalid credentials. Please check your email and password.');
      }
    }

    const response = await this.api.post('/api/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  }

  async logout() {
    if (this.isDemoMode) {
      console.log('[DEMO] Logout');
      localStorage.removeItem('auth_token');
      return { success: true };
    }

    await this.api.post('/api/auth/logout');
    localStorage.removeItem('auth_token');
  }

  // Chat operations
  async createChat(userData: { name: string; email: string }) {
    if (this.isDemoMode) {
      console.log('[DEMO] Creating chat for:', userData);
      const chat = createMockChat(userData);
      
      // Simulate system message
      setTimeout(() => {
        addMockMessage(chat.id, {
          chatId: chat.id,
          userId: 'system',
          content: 'Welcome to support! An agent will be with you shortly.',
          type: 'system',
          isRead: false,
          isAgent: false
        });
      }, 1000);
      
      return chat;
    }

    const response = await this.api.post('/api/chats', userData);
    return response.data;
  }

  async getChats() {
    if (this.isDemoMode) {
      console.log('[DEMO] Getting chats');
      return [...mockChats];
    }

    const response = await this.api.get('/api/chats');
    return response.data;
  }

  async getChatById(chatId: string) {
    if (this.isDemoMode) {
      console.log('[DEMO] Getting chat by ID:', chatId);
      const chat = mockChats.find(c => c.id === chatId);
      if (!chat) throw new Error('Chat not found');
      return chat;
    }

    const response = await this.api.get(`/api/chats/${chatId}`);
    return response.data;
  }

  async sendMessage(chatId: string, messageData: {
    content: string;
    type: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    voiceDuration?: number;
  }) {
    if (this.isDemoMode) {
      console.log('[DEMO] Sending message:', messageData);
      
      // Determine if this is from an agent or user
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const isAgent = 'status' in currentUser;
      
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
        isAgent
      });

      // Simulate agent response after user message
      if (!isAgent && messageData.type === 'text') {
        setTimeout(() => {
          const responses = [
            "Thank you for your message. I'm looking into this for you.",
            "I understand your concern. Let me help you with that.",
            "Could you please provide more details about the issue?",
            "I'll check on this right away and get back to you.",
            "That's a great question. Let me find the answer for you."
          ];
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          
          addMockMessage(chatId, {
            chatId,
            userId: 'agent1',
            content: randomResponse,
            type: 'text',
            isRead: false,
            isAgent: true
          });
        }, 2000 + Math.random() * 3000); // Random delay between 2-5 seconds
      }

      return message;
    }

    const response = await this.api.post(`/api/chats/${chatId}/messages`, messageData);
    return response.data;
  }

  async markMessageAsRead(messageId: string) {
    if (this.isDemoMode) {
      console.log('[DEMO] Marking message as read:', messageId);
      mockMarkMessageAsRead(messageId);
      return { success: true };
    }

    const response = await this.api.put(`/api/messages/${messageId}/read`);
    return response.data;
  }

  // File operations
  async uploadFile(file: File, chatId: string) {
    if (this.isDemoMode) {
      console.log('[DEMO] Uploading file:', file.name);
      
      // Simulate file upload with a fake URL
      const fakeUrl = `https://demo-storage.example.com/files/${Date.now()}-${file.name}`;
      
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            url: fakeUrl,
            fileName: file.name,
            fileSize: file.size,
            success: true
          });
        }, 1000 + Math.random() * 2000); // Simulate upload time
      });
    }

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
  }

  // Agent operations
  async getAgentChats() {
    if (this.isDemoMode) {
      console.log('[DEMO] Getting agent chats');
      return [...mockChats];
    }

    const response = await this.api.get('/api/agent/chats');
    return response.data;
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
            isAgent: false
          });
        }, 500);
      }
      
      return updatedChat;
    }

    const response = await this.api.post(`/api/agent/chats/${chatId}/assign`);
    return response.data;
  }

  async updateAgentStatus(status: string) {
    if (this.isDemoMode) {
      console.log('[DEMO] Updating agent status:', status);
      const currentAgent = JSON.parse(localStorage.getItem('user') || '{}');
      currentAgent.status = status;
      localStorage.setItem('user', JSON.stringify(currentAgent));
      return { success: true, status };
    }

    const response = await this.api.put('/api/agent/status', { status });
    return response.data;
  }

  // Typing indicators
  async sendTypingStatus(chatId: string, isTyping: boolean) {
    if (this.isDemoMode) {
      console.log('[DEMO] Sending typing status:', { chatId, isTyping });
      return { success: true };
    }

    const response = await this.api.post(`/api/chats/${chatId}/typing`, { isTyping });
    return response.data;
  }
}

export default new ApiService();