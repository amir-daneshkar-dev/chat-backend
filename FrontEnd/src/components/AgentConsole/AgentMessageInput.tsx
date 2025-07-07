import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Mic, Smile, X, Bold, Italic, Link } from 'lucide-react';
import FileUpload from '../shared/FileUpload';
import VoiceRecorder from '../ChatWidget/VoiceRecorder';

interface AgentMessageInputProps {
  onSendMessage: (content: string) => void;
  onFileUpload: (file: File) => Promise<void>;
  onVoiceMessage: (audioBlob: Blob, duration: number) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

const AgentMessageInput: React.FC<AgentMessageInputProps> = ({
  onSendMessage,
  onFileUpload,
  onVoiceMessage,
  onTyping,
  disabled = false,
  placeholder = 'Type your response...'
}) => {
  const [message, setMessage] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      onTyping(false);
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 1000);
  }, [isTyping, onTyping]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      setIsTyping(false);
      onTyping(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [message, disabled, onSendMessage, onTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleVoiceComplete = useCallback((audioBlob: Blob, duration: number) => {
    onVoiceMessage(audioBlob, duration);
    setShowVoiceRecorder(false);
  }, [onVoiceMessage]);

  const insertQuickResponse = useCallback((response: string) => {
    setMessage(prev => prev + response);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const quickResponses = [
    'Thank you for contacting us!',
    'I understand your concern.',
    'Let me help you with that.',
    'Could you please provide more details?',
    'Is there anything else I can help you with?',
  ];

  return (
    <div className="border-t bg-white p-4 space-y-4">
      {/* Quick Responses */}
      <div className="flex flex-wrap gap-2">
        {quickResponses.map((response, index) => (
          <button
            key={index}
            onClick={() => insertQuickResponse(response)}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            {response}
          </button>
        ))}
      </div>

      {/* File Upload Panel */}
      {showFileUpload && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Upload File</h3>
            <button
              onClick={() => setShowFileUpload(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <FileUpload
            onFileSelect={() => {}}
            onUpload={async (file) => {
              await onFileUpload(file);
              setShowFileUpload(false);
            }}
          />
        </div>
      )}

      {/* Voice Recorder Panel */}
      {showVoiceRecorder && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Voice Message</h3>
            <button
              onClick={() => setShowVoiceRecorder(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <VoiceRecorder onRecordingComplete={handleVoiceComplete} />
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[60px] max-h-40"
              rows={2}
            />
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span className="text-sm">Send</span>
          </button>
        </div>
        
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowFileUpload(!showFileUpload)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              disabled={disabled}
            >
              <Paperclip className="h-4 w-4" />
            </button>
            
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              disabled={disabled}
            >
              <Mic className="h-4 w-4" />
            </button>
            
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              disabled={disabled}
            >
              <Smile className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Shift + Enter for new line</span>
            <span>•</span>
            <span>{message.length} characters</span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AgentMessageInput;