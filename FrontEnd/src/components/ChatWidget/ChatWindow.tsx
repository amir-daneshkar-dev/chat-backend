import React from 'react';
import { X, Minimize2, Users, Wifi, WifiOff } from 'lucide-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from '../shared/TypingIndicator';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  userData: { name: string; email: string };
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  onMinimize,
  userData
}) => {
  const { isConnected } = useSocket();
  const {
    currentChat,
    messages,
    typingStatuses,
    loading,
    error,
    initializeChat,
    sendMessage,
    uploadFile,
    sendTypingStatus,
    markMessageAsRead,
  } = useChat();

  React.useEffect(() => {
    if (isOpen && !currentChat) {
      initializeChat(userData);
    }
  }, [isOpen, currentChat, userData, initializeChat]);

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage({ content, type: 'text' });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      await uploadFile(file);
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  const handleVoiceMessage = async (audioBlob: Blob, duration: number) => {
    try {
      // Convert blob to file for upload
      const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
      const uploadResult = await uploadFile(file);
      
      // Send voice message
      await sendMessage({
        content: 'Voice message',
        type: 'voice',
        fileUrl: uploadResult?.fileUrl,
        voiceDuration: duration,
      });
    } catch (error) {
      console.error('Failed to send voice message:', error);
    }
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (loading) return 'Connecting...';
    if (currentChat?.agent) return `Connected with ${currentChat.agent.name}`;
    if (currentChat?.queuePosition) return `Queue position: #${currentChat.queuePosition}`;
    return 'Waiting for agent...';
  };

  const getStatusColor = () => {
    if (!isConnected) return 'text-red-500';
    if (loading) return 'text-yellow-500';
    if (currentChat?.agent) return 'text-green-500';
    return 'text-blue-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border flex flex-col animate-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Support Chat</h3>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              <span className={`text-xs ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onMinimize}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 m-3 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting to support...</p>
          </div>
        </div>
      )}

      {/* Chat Content */}
      {!loading && currentChat && (
        <>
          {/* Messages */}
          <MessageList
            messages={messages}
            onMarkAsRead={markMessageAsRead}
            className="flex-1"
          />

          {/* Typing Indicator */}
          <TypingIndicator
            isTyping={typingStatuses.some(ts => ts.isTyping && ts.userId !== currentChat.user.id)}
            userName={currentChat.agent?.name || 'Agent'}
          />

          {/* Message Input */}
          <MessageInput
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            onVoiceMessage={handleVoiceMessage}
            onTyping={sendTypingStatus}
            disabled={!isConnected}
            placeholder="Type your message..."
          />
        </>
      )}
    </div>
  );
};

export default ChatWindow;