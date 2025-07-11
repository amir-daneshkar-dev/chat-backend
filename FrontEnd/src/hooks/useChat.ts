import { useState, useEffect, useCallback } from 'react';
import { Chat, Message, TypingStatus } from '../types';
import apiService from '../services/api';
import socketService from '../services/socket';

export const useChat = (chatId?: string) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingStatuses, setTypingStatuses] = useState<TypingStatus[]>([]);
  const [typingTimeouts, setTypingTimeouts] = useState<Map<string, number>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize chat
  const initializeChat = useCallback(
    async (userData?: { name: string; email: string }) => {
      try {
        setLoading(true);
        setError(null);

        let chat: Chat;

        if (chatId) {
          chat = await apiService.getChatById(chatId);
        } else if (userData) {
          console.log('Creating new chat for user:', userData.email);

          // First check if user has existing chats
          const existingChats = await apiService.getUserChats(userData.email);
          const activeChat = existingChats.find(
            (c: Chat) => c.status === 'active' || c.status === 'waiting'
          );

          if (activeChat) {
            console.log('Found existing active chat:', activeChat.id);
            chat = activeChat;
          } else {
            console.log('Creating new chat...');
            // Create new chat - backend will return token for guest user
            const response = await apiService.createChat(userData);
            console.log('Chat creation response:', response);

            // If backend returns token, set it for authorization
            if (response.token) {
              console.log('Setting token for authorization');
              localStorage.setItem('auth_token', response.token);
              localStorage.setItem(
                'user',
                JSON.stringify(response.user || userData)
              );

              // Update socket service with new token (don't await, just trigger the update)
              console.log('Updating socket service with token');
              await socketService.updateAuthToken(response.token);
            } else {
              console.log('No token received from backend');
            }

            chat = response.chat || response;
          }
        } else {
          throw new Error('Either chatId or userData is required');
        }

        setCurrentChat(chat);
        setMessages(chat.messages || []);

        // Establish WebSocket connection with token
        console.log('Ensuring socket connection');
        socketService.ensureConnection();

        // Join chat channel
        console.log('Joining chat channel:', chat.id);
        socketService.joinChatChannel(chat.id, {
          onMessage: (message: Message) => {
            setMessages((prev) => [...prev, message]);
          },
          onTyping: (typing: TypingStatus) => {
            // Validate the typing data structure
            if (!typing || typeof typing !== 'object') {
              console.error('useChat: Invalid typing data received:', typing);
              return;
            }

            if (
              !typing.chatId ||
              !typing.userId ||
              typeof typing.isTyping !== 'boolean'
            ) {
              console.error(
                'useChat: Missing required typing data fields:',
                typing
              );
              return;
            }
            setTypingStatuses((prev) => {
              console.log('mostafa: Typing status received:', typing);

              const filtered = prev.filter(
                (t) => t.chatId !== typing.chatId || t.userId !== typing.userId
              );
              return typing.isTyping ? [...filtered, typing] : filtered;
            });
          },
          onAgentJoined: (agent) => {
            console.log('agent join =', agent);
            setCurrentChat((prev) => (prev ? { ...prev, agent } : null));
          },
          onAgentLeft: () => {
            setCurrentChat((prev) =>
              prev ? { ...prev, agent: undefined } : null
            );
          },
        });

        console.log('Chat initialization completed successfully');
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to initialize chat'
        );
        throw error; // Re-throw to be caught by the form handler
      } finally {
        setLoading(false);
      }
    },
    [chatId]
  );

  // Send message
  const sendMessage = useCallback(
    async (messageData: {
      content: string;
      type: string;
      file_url?: string;
      file_name?: string;
      file_size?: number;
      voice_duration?: number;
    }) => {
      if (!currentChat) return;

      try {
        const message = await apiService.sendMessage(
          currentChat.id,
          messageData
        );
        setMessages((prev) => [...prev, message]);
        return message;
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      }
    },
    [currentChat]
  );

  // Upload file
  const uploadFile = useCallback(
    async (file: File) => {
      if (!currentChat) return;

      try {
        const uploadResult = await apiService.uploadFile(file, currentChat.id);

        const messageData = {
          content: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          file_url: uploadResult.url,
          file_name: file.name,
          file_size: file.size,
        };

        return await sendMessage(messageData);
      } catch (error) {
        console.error('Failed to upload file:', error);
        throw error;
      }
    },
    [currentChat, sendMessage]
  );

  // Send typing status
  const sendTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!currentChat) return;
      try {
        await apiService.sendTypingStatus(currentChat.id, isTyping);
        console.log('useChat: Typing status sent successfully');
      } catch (error) {
        console.error('Failed to send typing status:', error);
      }
    },
    [currentChat]
  );

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await apiService.markMessageAsRead(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, []);

  // Monitor typing statuses changes
  useEffect(() => {}, [typingStatuses]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentChat) {
        socketService.leaveChatChannel(currentChat.id);
      }

      // Clear all typing timeouts
      typingTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, [currentChat, typingTimeouts]);

  return {
    chats,
    currentChat,
    messages,
    typingStatuses,
    isConnected,
    loading,
    error,
    initializeChat,
    sendMessage,
    uploadFile,
    sendTypingStatus,
    markMessageAsRead,
  };
};
