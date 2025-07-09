import React, { useState, useCallback } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import ChatWindow from './ChatWindow';

interface ChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  className?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  position = 'bottom-right',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <ChatWindow
          isOpen={isOpen}
          onClose={handleClose}
          onMinimize={handleMinimize}
        />
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="mb-4 bg-white rounded-lg shadow-lg border p-3 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">Support Chat</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <Minimize2 className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleToggle}
        className={`
          w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full 
          shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center
          hover:scale-110 active:scale-95
          ${isOpen ? 'rotate-45' : 'rotate-0'}
        `}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Notification Badge */}
      {!isOpen && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
          1
        </div>
      )}
    </div>
  );
};

export default ChatWidget;