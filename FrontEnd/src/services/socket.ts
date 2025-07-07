import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import demoSocket from './demoSocket';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo;
  }
}

window.Pusher = Pusher;

class SocketService {
  private echo: Echo | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isDemoMode: boolean;

  constructor() {
    this.isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    
    if (this.isDemoMode) {
      console.log('🎭 Socket running in DEMO MODE');
    } else {
      this.initializeEcho();
    }
  }

  private initializeEcho() {
    try {
      this.echo = new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY,
        wsHost: import.meta.env.VITE_PUSHER_HOST,
        wsPort: import.meta.env.VITE_PUSHER_PORT,
        wssPort: import.meta.env.VITE_PUSHER_PORT,
        forceTLS: import.meta.env.VITE_PUSHER_SCHEME === 'wss',
        cluster: import.meta.env.VITE_PUSHER_CLUSTER,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        auth: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        },
      });

      this.setupConnectionHandlers();
    } catch (error) {
      console.error('Failed to initialize Echo:', error);
      this.handleReconnection();
    }
  }

  private setupConnectionHandlers() {
    if (!this.echo) return;

    this.echo.connector.pusher.connection.bind('connected', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.echo.connector.pusher.connection.bind('disconnected', () => {
      console.log('WebSocket disconnected');
      this.handleReconnection();
    });

    this.echo.connector.pusher.connection.bind('error', (error: any) => {
      console.error('WebSocket error:', error);
      this.handleReconnection();
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnection attempt ${this.reconnectAttempts}`);
        this.initializeEcho();
      }, 1000 * Math.pow(2, this.reconnectAttempts));
    }
  }

  // Chat channels
  joinChatChannel(chatId: string, callbacks: {
    onMessage?: (message: any) => void;
    onTyping?: (typing: any) => void;
    onAgentJoined?: (agent: any) => void;
    onAgentLeft?: (agent: any) => void;
  }) {
    if (this.isDemoMode) {
      return demoSocket.joinChatChannel(chatId, callbacks);
    }

    if (!this.echo) return null;

    const channel = this.echo.private(`chat.${chatId}`);

    if (callbacks.onMessage) {
      channel.listen('MessageSent', callbacks.onMessage);
    }

    if (callbacks.onTyping) {
      channel.listen('UserTyping', callbacks.onTyping);
    }

    if (callbacks.onAgentJoined) {
      channel.listen('AgentJoined', callbacks.onAgentJoined);
    }

    if (callbacks.onAgentLeft) {
      channel.listen('AgentLeft', callbacks.onAgentLeft);
    }

    return channel;
  }

  leaveChatChannel(chatId: string) {
    if (this.isDemoMode) {
      return demoSocket.leaveChatChannel(chatId);
    }

    if (!this.echo) return;
    this.echo.leave(`chat.${chatId}`);
  }

  // Agent channels
  joinAgentChannel(callbacks: {
    onNewChat?: (chat: any) => void;
    onChatUpdate?: (chat: any) => void;
    onMessage?: (message: any) => void;
  }) {
    if (this.isDemoMode) {
      return demoSocket.joinAgentChannel(callbacks);
    }

    if (!this.echo) return null;

    const channel = this.echo.private('agent.dashboard');

    if (callbacks.onNewChat) {
      channel.listen('NewChatAssigned', callbacks.onNewChat);
    }

    if (callbacks.onChatUpdate) {
      channel.listen('ChatUpdated', callbacks.onChatUpdate);
    }

    if (callbacks.onMessage) {
      channel.listen('MessageReceived', callbacks.onMessage);
    }

    return channel;
  }

  leaveAgentChannel() {
    if (this.isDemoMode) {
      return demoSocket.leaveAgentChannel();
    }

    if (!this.echo) return;
    this.echo.leave('agent.dashboard');
  }

  // Presence channels
  joinPresenceChannel(channelName: string, callbacks: {
    onHere?: (users: any[]) => void;
    onJoining?: (user: any) => void;
    onLeaving?: (user: any) => void;
  }) {
    if (this.isDemoMode) {
      return demoSocket.joinPresenceChannel(channelName, callbacks);
    }

    if (!this.echo) return null;

    const channel = this.echo.join(channelName);

    if (callbacks.onHere) {
      channel.here(callbacks.onHere);
    }

    if (callbacks.onJoining) {
      channel.joining(callbacks.onJoining);
    }

    if (callbacks.onLeaving) {
      channel.leaving(callbacks.onLeaving);
    }

    return channel;
  }

  leavePresenceChannel(channelName: string) {
    if (this.isDemoMode) {
      return demoSocket.leavePresenceChannel(channelName);
    }

    if (!this.echo) return;
    this.echo.leave(channelName);
  }

  // Utility methods
  isConnected(): boolean {
    if (this.isDemoMode) {
      return demoSocket.isConnected();
    }

    return this.echo?.connector?.pusher?.connection?.state === 'connected';
  }

  disconnect() {
    if (this.isDemoMode) {
      return demoSocket.disconnect();
    }

    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
    }
  }

  reconnect() {
    if (this.isDemoMode) {
      return demoSocket.reconnect();
    }

    this.disconnect();
    this.initializeEcho();
  }
}

export default new SocketService();