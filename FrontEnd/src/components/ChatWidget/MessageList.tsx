import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Download, Play, Pause, FileText, Image as ImageIcon, Check, CheckCheck } from 'lucide-react';
import { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  onMarkAsRead: (messageId: string) => void;
  className?: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  onMarkAsRead,
  className = ''
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date) => {
    return format(new Date(date), 'HH:mm');
  };

  const renderMessage = (message: Message) => {
    const isAgent = message.isAgent;
    
    return (
      <div
        key={message.id}
        className={`flex ${isAgent ? 'justify-start' : 'justify-end'} mb-4`}
      >
        <div
          className={`
            max-w-xs lg:max-w-md px-4 py-2 rounded-lg
            ${isAgent
              ? 'bg-gray-100 text-gray-900'
              : 'bg-blue-600 text-white'
            }
          `}
        >
          {message.type === 'text' && (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
          
          {message.type === 'image' && (
            <div className="space-y-2">
              <img
                src={message.fileUrl}
                alt={message.fileName}
                className="rounded-lg max-w-full h-auto"
              />
              <p className="text-xs opacity-75">{message.fileName}</p>
            </div>
          )}
          
          {message.type === 'file' && (
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.fileName}</p>
                <p className="text-xs opacity-75">
                  {message.fileSize && `${(message.fileSize / 1024).toFixed(1)} KB`}
                </p>
              </div>
              <a
                href={message.fileUrl}
                download={message.fileName}
                className="p-1 hover:bg-black/10 rounded"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          )}
          
          {message.type === 'voice' && (
            <div className="flex items-center space-x-2">
              <button className="p-1 hover:bg-black/10 rounded">
                <Play className="h-4 w-4" />
              </button>
              <div className="flex-1">
                <div className="h-2 bg-black/20 rounded-full">
                  <div className="h-2 bg-white rounded-full w-0"></div>
                </div>
                <p className="text-xs opacity-75 mt-1">
                  {message.voiceDuration}s
                </p>
              </div>
            </div>
          )}
          
          {message.type === 'system' && (
            <p className="text-xs text-center opacity-75 italic">
              {message.content}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs opacity-75">
              {formatTime(message.timestamp)}
            </span>
            
            {!isAgent && (
              <div className="flex items-center">
                {message.isRead ? (
                  <CheckCheck className="h-3 w-3 text-green-400" />
                ) : (
                  <Check className="h-3 w-3 opacity-50" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 space-y-2 ${className}`}>
      {messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No messages yet. Start a conversation!</p>
        </div>
      ) : (
        messages.map(renderMessage)
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;