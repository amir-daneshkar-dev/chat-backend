import React, { useState } from 'react';
import {
  X,
  Minimize2,
  Users,
  Wifi,
  WifiOff,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from '../shared/TypingIndicator';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  userData?: { name: string; email: string };
}

interface UserForm {
  name: string;
  email: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  onMinimize,
  userData,
}) => {
  const { isConnected } = useSocket();
  const [showUserForm, setShowUserForm] = useState(!userData);
  const [userForm, setUserForm] = useState<UserForm>({
    name: userData?.name || '',
    email: userData?.email || '',
  });
  const [formErrors, setFormErrors] = useState<Partial<UserForm>>({});
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formSubmissionError, setFormSubmissionError] = useState<string | null>(
    null
  );

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

  // Debug typing statuses
  React.useEffect(() => {
    console.log('amir: Typing statuses:', typingStatuses);
  }, [typingStatuses]);

  const validateForm = (): boolean => {
    const errors: Partial<UserForm> = {};

    if (!userForm.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!userForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmittingForm(true);
    setFormSubmissionError(null);

    try {
      await initializeChat(userForm);
      setShowUserForm(false);
    } catch (error) {
      console.error('Failed to start chat:', error);
      setFormSubmissionError(
        error instanceof Error
          ? error.message
          : 'Failed to start chat. Please try again.'
      );
    } finally {
      setIsSubmittingForm(false);
    }
  };

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
      const file = new File([audioBlob], 'voice-message.webm', {
        type: 'audio/webm',
      });
      const uploadResult = await uploadFile(file, 'voice');

      // Send voice message
      // await sendMessage({
      //   content: 'Voice message',
      //   type: 'voice',
      //   file_url: uploadResult?.file_url,
      //   voice_duration: duration,
      // });
    } catch (error) {
      console.error('Failed to send voice message:', error);
    }
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (loading) return 'Connecting...';
    if (currentChat?.agent) return `Connected with ${currentChat.agent.name}`;
    if (currentChat?.queuePosition)
      return `Queue position: #${currentChat.queuePosition}`;
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
    <div className='fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border flex flex-col animate-in slide-in-from-bottom-2 duration-300'>
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='w-8 h-8 bg-white/20 rounded-full flex items-center justify-center'>
            <Users className='h-5 w-5' />
          </div>
          <div>
            <h3 className='font-semibold text-sm'>Support Chat</h3>
            {!showUserForm && (
              <div className='flex items-center space-x-2'>
                {isConnected ? (
                  <Wifi className='h-3 w-3' />
                ) : (
                  <WifiOff className='h-3 w-3' />
                )}
                <span className={`text-xs ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <button
            onClick={onMinimize}
            className='p-1 hover:bg-white/20 rounded transition-colors'
          >
            <Minimize2 className='h-4 w-4' />
          </button>
          <button
            onClick={onClose}
            className='p-1 hover:bg-white/20 rounded transition-colors'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      </div>

      {/* User Information Form */}
      {showUserForm && (
        <div className='flex-1 flex items-center justify-center p-6'>
          <div className='w-full max-w-sm'>
            <div className='text-center mb-6'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <UserIcon className='h-8 w-8 text-blue-600' />
              </div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                Welcome to Support
              </h2>
              <p className='text-gray-600 text-sm'>
                Please provide your information to start chatting with our
                support team.
              </p>
            </div>

            <form onSubmit={handleUserFormSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Full Name
                </label>
                <input
                  type='text'
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder='Enter your full name'
                  disabled={isSubmittingForm}
                />
                {formErrors.name && (
                  <p className='text-red-500 text-xs mt-1'>{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email Address
                </label>
                <input
                  type='email'
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder='Enter your email address'
                  disabled={isSubmittingForm}
                />
                {formErrors.email && (
                  <p className='text-red-500 text-xs mt-1'>
                    {formErrors.email}
                  </p>
                )}
              </div>

              <button
                type='submit'
                disabled={isSubmittingForm}
                className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2'
              >
                {isSubmittingForm ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    <span>Starting Chat...</span>
                  </>
                ) : (
                  <>
                    <Mail className='h-4 w-4' />
                    <span>Start Chat</span>
                  </>
                )}
              </button>

              {/* Form submission error */}
              {formSubmissionError && (
                <div className='bg-red-50 border border-red-200 p-3 rounded-lg'>
                  <p className='text-red-800 text-sm'>{formSubmissionError}</p>
                </div>
              )}
            </form>

            <div className='mt-4 text-center'>
              <p className='text-xs text-gray-500'>
                By starting a chat, you agree to our terms of service and
                privacy policy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !showUserForm && (
        <div className='bg-red-50 border border-red-200 p-3 m-3 rounded-lg'>
          <p className='text-red-800 text-sm'>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !showUserForm && (
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Connecting to support...</p>
          </div>
        </div>
      )}

      {/* Chat Content */}
      {!loading && !showUserForm && currentChat && (
        <>
          {/* Messages */}
          <MessageList
            messages={messages}
            onMarkAsRead={markMessageAsRead}
            className='flex-1'
          />

          {/* Typing Indicator */}
          <TypingIndicator
            isTyping={typingStatuses.some((ts) => {
              // Only show typing indicator if the agent is typing
              return ts.isTyping && ts.userId !== currentChat.user.id;
            })}
            userName={currentChat.agent?.name || 'Agent'}
          />

          {/* Message Input */}
          <MessageInput
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            onVoiceMessage={handleVoiceMessage}
            onTyping={sendTypingStatus}
            disabled={!isConnected}
            placeholder='Type your message...'
          />
        </>
      )}
    </div>
  );
};

export default ChatWindow;
