class DemoSocketService {
  private _isConnected = true;
  private channels: Map<string, any> = new Map();

  // Simulate connection status
  isConnected(): boolean {
    return this._isConnected;
  }

  // Chat channels
  joinChatChannel(
    chatId: string,
    callbacks: {
      onMessage?: (message: any) => void;
      onTyping?: (typing: any) => void;
      onAgentJoined?: (agent: any) => void;
      onAgentLeft?: (agent: any) => void;
    }
  ) {
    console.log(`[Demo] Joining chat channel: ${chatId}`);

    const channel = {
      chatId,
      callbacks,
      // Simulate some events
      simulateEvents: () => {
        // Simulate typing indicator occasionally
        if (callbacks.onTyping && Math.random() > 0.7) {
          setTimeout(() => {
            callbacks.onTyping!({
              chatId,
              userId: 'agent-1',
              userName: 'Agent Smith',
              isTyping: true,
              timestamp: new Date(),
            });

            setTimeout(() => {
              callbacks.onTyping!({
                chatId,
                userId: 'agent-1',
                userName: 'Agent Smith',
                isTyping: false,
                timestamp: new Date(),
              });
            }, 2000);
          }, 3000);
        }
      },
    };

    this.channels.set(`chat.${chatId}`, channel);
    channel.simulateEvents();

    return channel;
  }

  leaveChatChannel(chatId: string) {
    console.log(`[Demo] Leaving chat channel: ${chatId}`);
    this.channels.delete(`chat.${chatId}`);
  }

  // Agent channels
  joinAgentChannel(callbacks: {
    onNewChat?: (chat: any) => void;
    onChatUpdate?: (chat: any) => void;
    onMessage?: (message: any) => void;
  }) {
    console.log('[Demo] Joining agent channel');

    const channel = {
      callbacks,
      // Simulate new chats occasionally
      simulateEvents: () => {
        if (callbacks.onNewChat && Math.random() > 0.8) {
          setTimeout(() => {
            console.log('[Demo] Simulating new chat assignment');
            // This would trigger in a real scenario
          }, 10000);
        }
      },
    };

    this.channels.set('agent.dashboard', channel);
    channel.simulateEvents();

    return channel;
  }

  leaveAgentChannel() {
    console.log('[Demo] Leaving agent channel');
    this.channels.delete('agent.dashboard');
  }

  // Presence channels
  joinPresenceChannel(
    channelName: string,
    callbacks: {
      onHere?: (users: any[]) => void;
      onJoining?: (user: any) => void;
      onLeaving?: (user: any) => void;
    }
  ) {
    console.log(`[Demo] Joining presence channel: ${channelName}`);

    // Simulate some users already present
    if (callbacks.onHere) {
      setTimeout(() => {
        callbacks.onHere!([
          { id: 'agent-1', name: 'Agent Smith' },
          { id: 'agent-2', name: 'Agent Johnson' },
        ]);
      }, 500);
    }

    return { channelName, callbacks };
  }

  leavePresenceChannel(channelName: string) {
    console.log(`[Demo] Leaving presence channel: ${channelName}`);
  }

  disconnect() {
    console.log('[Demo] Disconnecting socket');
    this._isConnected = false;
    this.channels.clear();
  }

  reconnect() {
    console.log('[Demo] Reconnecting socket');
    this._isConnected = true;
  }
}

export default new DemoSocketService();
