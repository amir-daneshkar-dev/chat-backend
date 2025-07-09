import React, { useEffect, useRef } from 'react';
import { User, Clock, Phone, Mail, ExternalLink } from 'lucide-react';
import MessageList from '../ChatWidget/MessageList';
import AgentMessageInput from './AgentMessageInput';
import TypingIndicator from '../shared/TypingIndicator';
import { Chat } from '../../types';

interface ChatSessionProps {
  chat: Chat;
  onSendMessage: (content: string) => void;
  onFileUpload: (file: File) => Promise<void>;
  onVoiceMessage: (audioBlob: Blob, duration: number) => void;
  onTyping: (isTyping: boolean) => void;
  onMarkAsRead: (messageId: string) => void;
  typingStatuses: any[];
}

const ChatSession: React.FC<ChatSessionProps> = ({
  chat,
  onSendMessage,
  onFileUpload,
  onVoiceMessage,
  onTyping,
  onMarkAsRead,
  typingStatuses,
}) => {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getQueueText = () => {
    if (chat.status === 'waiting') {
      return `Queue position: #${chat.queuePosition || 'N/A'}`;
    }
    return `Started: ${formatTime(chat.createdAt)}`;
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Chat Header */}
      <div className='border-b bg-white px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
              <User className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                {chat.user.name}
              </h2>
              <div className='flex items-center space-x-4 text-sm text-gray-500'>
                <div className='flex items-center space-x-1'>
                  <Mail className='h-4 w-4' />
                  <span>{chat.user.email}</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <Clock className='h-4 w-4' />
                  <span>{getQueueText()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            <div
              className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${
                chat.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : chat.status === 'waiting'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }
            `}
            >
              {chat.status === 'active'
                ? 'Active'
                : chat.status === 'waiting'
                ? 'Waiting'
                : 'Closed'}
            </div>

            <div className='flex items-center space-x-2'>
              <button className='p-2 text-gray-500 hover:text-gray-700 transition-colors'>
                <Phone className='h-4 w-4' />
              </button>
              <button className='p-2 text-gray-500 hover:text-gray-700 transition-colors'>
                <ExternalLink className='h-4 w-4' />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={chat.messages}
        onMarkAsRead={onMarkAsRead}
        className='flex-1 bg-gray-50'
      />

      {/* Typing Indicator */}
      <TypingIndicator
        isTyping={typingStatuses.some((ts) => {
          // Only show typing indicator if the user (not agent) is typing
          const isUserTyping = ts.isTyping && ts.userId === chat.user.id;

          // For debugging
          console.log('Agent ChatSession typing check:', {
            ts,
            chatUserId: chat.user.id,
            isUserTyping,
            typingStatuses: typingStatuses,
          });

          return isUserTyping;
        })}
        userName={chat.user.name}
      />

      {/* Message Input */}
      <AgentMessageInput
        onSendMessage={onSendMessage}
        onFileUpload={onFileUpload}
        onVoiceMessage={onVoiceMessage}
        onTyping={onTyping}
        placeholder='Type your response...'
      />
    </div>
  );
};

export default ChatSession;
