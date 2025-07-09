import React, { useState, useEffect, useCallback } from 'react';
import { Users, Settings, LogOut, Bell, Search, Filter } from 'lucide-react';
import ChatList from './ChatList';
import ChatSession from './ChatSession';
import { Chat, Agent } from '../../types';
import apiService from '../../services/api';
import socketService from '../../services/socket';
import authService from '../../services/auth';

interface AgentConsoleProps {
  className?: string;
}

const AgentConsole: React.FC<AgentConsoleProps> = ({ className = '' }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [typingStatuses, setTypingStatuses] = useState<any[]>([]);
  const [typingTimeouts, setTypingTimeouts] = useState<Map<string, number>>(
    new Map()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'waiting' | 'active' | 'closed'
  >('all');

  // Initialize agent and load chats
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        const agent = authService.getUser() as Agent;
        setCurrentAgent(agent);

        // Load chats
        const chatsData = await apiService.getAgentChats();
        setChats(chatsData);

        // Ensure socket connection is established
        socketService.ensureConnection();

        // Setup socket listeners
        console.log('Agent: Joining agent channel');
        const agentChannel = socketService.joinAgentChannel({
          onNewChat: (chat: Chat) => {
            console.log('Agent: New chat received:', chat.id);
            setChats((prev) => [chat, ...prev]);
          },
          onChatUpdate: (updatedChat: Chat) => {
            console.log('Agent: Chat update received:', updatedChat.id);
            setChats((prev) =>
              prev.map((c) => (c.id === updatedChat.id ? updatedChat : c))
            );
          },
          onMessage: (message: any) => {
            console.log(
              'Agent: Message received for chat:',
              message.chatId,
              'full data:',
              message
            );
            setChats((prev) =>
              prev.map((chat) =>
                chat.id === message.chatId
                  ? { ...chat, messages: [...chat.messages, message] }
                  : chat
              )
            );
          },
        });

        if (!agentChannel) {
          console.error('Agent: Failed to join agent channel');
        } else {
          console.log('Agent: Successfully joined agent channel');
        }
      } catch (error) {
        console.error('Failed to initialize agent console:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAgent();

    return () => {
      socketService.leaveAgentChannel();
    };
  }, []);

  // Cleanup chat channel when component unmounts
  useEffect(() => {
    return () => {
      if (selectedChatId) {
        socketService.leaveChatChannel(selectedChatId);
      }
    };
  }, [selectedChatId]);

  // Monitor typing statuses changes
  useEffect(() => {
    console.log('Agent: Typing statuses changed:', typingStatuses);
  }, [typingStatuses]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all typing timeouts
      typingTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, [typingTimeouts]);

  const handleChatSelect = useCallback(
    (chatId: string) => {
      // Leave previous chat channel if any
      if (selectedChatId) {
        console.log('Agent: Leaving previous chat channel:', selectedChatId);
        socketService.leaveChatChannel(selectedChatId);
      }

      setSelectedChatId(chatId);

      // Join the specific chat channel for this chat
      console.log('Agent: Joining chat channel:', chatId);
      socketService.joinChatChannel(chatId, {
        onMessage: (message: any) => {
          console.log(
            'Agent: Message received for chat:',
            chatId,
            'full data:',
            message
          );
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === chatId
                ? { ...chat, messages: [...chat.messages, message] }
                : chat
            )
          );
        },
        onTyping: (typing: any) => {
          console.log(
            'Agent: Typing event received for chat:',
            chatId,
            'full data:',
            typing
          );
          console.log('Agent: Typing event type:', typeof typing);
          console.log('Agent: Typing event keys:', Object.keys(typing));

          // Clear existing timeout for this user if it exists
          const timeoutKey = `${typing.chatId}-${typing.userId}`;
          const existingTimeout = typingTimeouts.get(timeoutKey);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          setTypingStatuses((prev) => {
            console.log('Agent: Previous typing statuses:', prev);
            const filtered = prev.filter(
              (t) => t.chatId !== typing.chatId || t.userId !== typing.userId
            );
            const newStatuses = typing.isTyping
              ? [...filtered, typing]
              : filtered;
            console.log('Agent: New typing statuses:', newStatuses);
            console.log(
              'Agent: Typing status update - isTyping:',
              typing.isTyping
            );
            console.log(
              'Agent: Typing status update - userName:',
              typing.userName
            );
            console.log('Agent: Typing status update - userId:', typing.userId);
            return newStatuses;
          });

          // Set new timeout to clear typing status after 5 seconds
          if (typing.isTyping) {
            const newTimeout = setTimeout(() => {
              console.log(
                'Agent: Clearing typing status for timeout:',
                timeoutKey
              );
              setTypingStatuses((prev) =>
                prev.filter(
                  (t) =>
                    t.chatId !== typing.chatId || t.userId !== typing.userId
                )
              );
              setTypingTimeouts((prev) => {
                const newMap = new Map(prev);
                newMap.delete(timeoutKey);
                return newMap;
              });
            }, 5000);

            setTypingTimeouts((prev) => {
              const newMap = new Map(prev);
              newMap.set(timeoutKey, newTimeout);
              return newMap;
            });
          } else {
            // Remove timeout if typing stopped
            setTypingTimeouts((prev) => {
              const newMap = new Map(prev);
              newMap.delete(timeoutKey);
              return newMap;
            });
          }
        },
        onAgentJoined: (agent) => {
          console.log('Agent: Agent joined event for chat:', chatId, agent);
          setChats((prev) =>
            prev.map((chat) => (chat.id === chatId ? { ...chat, agent } : chat))
          );
        },
        onAgentLeft: () => {
          console.log('Agent: Agent left event for chat:', chatId);
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === chatId ? { ...chat, agent: undefined } : chat
            )
          );
        },
      });

      // Mark chat as active if it was waiting
      const chat = chats.find((c) => c.id === chatId);
      if (chat && chat.status === 'waiting') {
        apiService.assignChatToAgent(chatId).then(() => {
          setChats((prev) =>
            prev.map((c) =>
              c.id === chatId
                ? {
                    ...c,
                    status: 'active' as const,
                    agent: currentAgent || undefined,
                  }
                : c
            )
          );
        });
      }
    },
    [chats, currentAgent, selectedChatId]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedChatId) return;

      try {
        const message = await apiService.sendMessage(selectedChatId, {
          content,
          type: 'text',
        });

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === selectedChatId
              ? { ...chat, messages: [...chat.messages, message] }
              : chat
          )
        );
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [selectedChatId]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!selectedChatId) return;

      try {
        const uploadResult = await apiService.uploadFile(file, selectedChatId);

        const messageData = {
          content: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          fileUrl: uploadResult.url,
          fileName: file.name,
          fileSize: file.size,
        };

        const message = await apiService.sendMessage(
          selectedChatId,
          messageData
        );

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === selectedChatId
              ? { ...chat, messages: [...chat.messages, message] }
              : chat
          )
        );
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    },
    [selectedChatId]
  );

  const handleVoiceMessage = useCallback(
    async (audioBlob: Blob, duration: number) => {
      if (!selectedChatId) return;

      try {
        const file = new File([audioBlob], 'voice-message.webm', {
          type: 'audio/webm',
        });
        const uploadResult = await apiService.uploadFile(file, selectedChatId);

        const messageData = {
          content: 'Voice message',
          type: 'voice',
          fileUrl: uploadResult.url,
          voiceDuration: duration,
        };

        const message = await apiService.sendMessage(
          selectedChatId,
          messageData
        );

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === selectedChatId
              ? { ...chat, messages: [...chat.messages, message] }
              : chat
          )
        );
      } catch (error) {
        console.error('Failed to send voice message:', error);
      }
    },
    [selectedChatId]
  );

  const handleTyping = useCallback(
    async (isTyping: boolean) => {
      if (!selectedChatId) return;

      try {
        await apiService.sendTypingStatus(selectedChatId, isTyping);
      } catch (error) {
        console.error('Failed to send typing status:', error);
      }
    },
    [selectedChatId]
  );

  const handleMarkAsRead = useCallback(async (messageId: string) => {
    try {
      await apiService.markMessageAsRead(messageId);
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          messages: chat.messages.map((msg) =>
            msg.id === messageId ? { ...msg, isRead: true } : msg
          ),
        }))
      );
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await apiService.logout();
      authService.logout();
      window.location.reload();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, []);

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      chat.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || chat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedChat = selectedChatId
    ? chats.find((c) => c.id === selectedChatId)
    : undefined;

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading agent console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col bg-gray-50 ${className}`}>
      {/* Header */}
      <header className='bg-white border-b px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
              <Users className='h-5 w-5 text-white' />
            </div>
            <div>
              <h1 className='text-xl font-bold text-gray-900'>Agent Console</h1>
              <p className='text-sm text-gray-500'>
                Welcome back, {currentAgent?.name}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-4'>
            <button className='p-2 text-gray-500 hover:text-gray-700 transition-colors'>
              <Bell className='h-5 w-5' />
            </button>
            <button className='p-2 text-gray-500 hover:text-gray-700 transition-colors'>
              <Settings className='h-5 w-5' />
            </button>
            <button
              onClick={handleLogout}
              className='p-2 text-gray-500 hover:text-gray-700 transition-colors'
            >
              <LogOut className='h-5 w-5' />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar */}
        <div className='w-80 flex flex-col'>
          {/* Search and Filter */}
          <div className='p-4 bg-white border-b'>
            <div className='space-y-3'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search chats...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='flex space-x-2'>
                {['all', 'waiting', 'active', 'closed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as any)}
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors
                      ${
                        statusFilter === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat List */}
          <ChatList
            chats={filteredChats}
            selectedChatId={selectedChatId}
            onChatSelect={handleChatSelect}
            className='flex-1'
          />
        </div>

        {/* Main Chat Area */}
        <div className='flex-1 flex flex-col'>
          {selectedChat ? (
            <ChatSession
              chat={selectedChat}
              onSendMessage={handleSendMessage}
              onFileUpload={handleFileUpload}
              onVoiceMessage={handleVoiceMessage}
              onTyping={handleTyping}
              onMarkAsRead={handleMarkAsRead}
              typingStatuses={typingStatuses}
            />
          ) : (
            <div className='flex-1 flex items-center justify-center bg-gray-50'>
              <div className='text-center'>
                <Users className='h-24 w-24 text-gray-400 mx-auto mb-4' />
                <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                  Select a chat to start
                </h2>
                <p className='text-gray-500'>
                  Choose a conversation from the sidebar to begin helping
                  customers
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentConsole;
