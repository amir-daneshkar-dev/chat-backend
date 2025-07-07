import { useState, useEffect, useCallback } from 'react';
import { Chat, Message, TypingStatus } from '../types';
import apiService from '../services/api';
import socketService from '../services/socket';

export const useChat = (chatId?: string) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingStatuses, setTypingStatuses] = useState<TypingStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize chat
  const initializeChat = useCallback(async (userData?: { name: string; email: string }) => {
    try {
      setLoading(true);
      setError(null);

      let chat: Chat;
      
      if (chatId) {
        chat = await apiService.getChatById(chatId);
      } else if (userData) {
        chat = await apiService.createChat(userData);
      } else {
        throw new Error('Either chatId or userData is required');
      }

      setCurrentChat(chat);
      setMessages(chat.messages || []);

      // Join chat channel
      socketService.joinChatChannel(chat.id, {
        onMessage: (message: Message) => {
          setMessages(prev => [...prev, message]);
        },
        onTyping: (typing: TypingStatus) => {
          setTypingStatuses(prev => {
            const filtered = prev.filter(t => 
              t.chatId !== typing.chatId || t.userId !== typing.userId
            );
            return typing.isTyping ? [...filtered, typing] : filtered;
          });
        },
        onAgentJoined: (agent) => {
          setCurrentChat(prev => prev ? { ...prev, agent } : null);
        },
        onAgentLeft: () => {
          setCurrentChat(prev => prev ? { ...prev, agent: undefined } : null);
        }
      });

      setIsConnected(true);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // Send message
  const sendMessage = useCallback(async (messageData: {
    content: string;
    type: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    voiceDuration?: number;
  }) => {
    if (!currentChat) return;

    try {
      const message = await apiService.sendMessage(currentChat.id, messageData);
      setMessages(prev => [...prev, message]);
      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [currentChat]);

  // Upload file
  const uploadFile = useCallback(async (file: File) => {
    if (!currentChat) return;

    try {
      const uploadResult = await apiService.uploadFile(file, currentChat.id);
      
      const messageData = {
        content: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl: uploadResult.url,
        fileName: file.name,
        fileSize: file.size,
      };

      return await sendMessage(messageData);
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }, [currentChat, sendMessage]);

  // Send typing status
  const sendTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!currentChat) return;

    try {
      await apiService.sendTypingStatus(currentChat.id, isTyping);
    } catch (error) {
      console.error('Failed to send typing status:', error);
    }
  }, [currentChat]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await apiService.markMessageAsRead(messageId);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentChat) {
        socketService.leaveChatChannel(currentChat.id);
      }
    };
  }, [currentChat]);

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