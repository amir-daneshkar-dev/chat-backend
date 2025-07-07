import React from 'react';
import { format } from 'date-fns';
import { User, Clock, MessageCircle, AlertCircle } from 'lucide-react';
import { Chat } from '../../types';

interface ChatListProps {
  chats: Chat[];
  selectedChatId?: string;
  onChatSelect: (chatId: string) => void;
  className?: string;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onChatSelect,
  className = ''
}) => {
  const formatTime = (date: Date) => {
    return format(new Date(date), 'HH:mm');
  };

  const getLastMessage = (chat: Chat) => {
    if (chat.messages.length === 0) return 'No messages yet';
    const lastMessage = chat.messages[chat.messages.length - 1];
    
    if (lastMessage.type === 'text') {
      return lastMessage.content.length > 50 
        ? `${lastMessage.content.substring(0, 50)}...`
        : lastMessage.content;
    }
    
    switch (lastMessage.type) {
      case 'image':
        return '📷 Image';
      case 'file':
        return '📎 File';
      case 'voice':
        return '🎵 Voice message';
      default:
        return lastMessage.content;
    }
  };

  const sortedChats = [...chats].sort((a, b) => {
    // Priority: waiting > active > closed
    const statusPriority = { waiting: 3, active: 2, closed: 1 };
    const aPriority = statusPriority[a.status];
    const bPriority = statusPriority[b.status];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    // Then by most recent activity
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className={`bg-white border-r overflow-y-auto ${className}`}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Support Chats</h2>
        <p className="text-sm text-gray-500">
          {chats.filter(c => c.status === 'waiting').length} waiting • 
          {chats.filter(c => c.status === 'active').length} active
        </p>
      </div>
      
      <div className="space-y-1 p-2">
        {sortedChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onChatSelect(chat.id)}
            className={`
              p-3 rounded-lg cursor-pointer transition-all duration-200
              ${selectedChatId === chat.id 
                ? 'bg-blue-50 border-blue-200 border' 
                : 'hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                
                {chat.status === 'waiting' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-2 w-2 text-white" />
                  </div>
                )}
                
                {chat.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {chat.user.name}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatTime(chat.updatedAt)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 truncate">
                  {getLastMessage(chat)}
                </p>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center space-x-2">
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${chat.status === 'active' ? 'bg-green-100 text-green-800' : 
                        chat.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}
                    `}>
                      {chat.status === 'active' ? 'Active' : 
                       chat.status === 'waiting' ? `Queue #${chat.queuePosition || '?'}` : 'Closed'}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <MessageCircle className="h-3 w-3" />
                    <span>{chat.messages.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {chats.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No chats yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;