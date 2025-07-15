import React, { useEffect, useState } from "react";
import { X, MessageCircle, User } from "lucide-react";

interface NotificationToastProps {
    id: string;
    title: string;
    message: string;
    userName: string;
    chatId: string;
    onClose: (id: string) => void;
    onClick: (chatId: string) => void;
    duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
    id,
    title,
    message,
    userName,
    chatId,
    onClose,
    onClick,
    duration = 5000,
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(id), 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const handleClick = () => {
        onClick(chatId);
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
    };

    return (
        <div
            className={`
                max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200 
                transform transition-all duration-300 ease-in-out cursor-pointer
                ${
                    isVisible
                        ? "translate-x-0 opacity-100"
                        : "translate-x-full opacity-0"
                }
            `}
            onClick={handleClick}
        >
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <MessageCircle className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                                <User className="h-3 w-3 text-gray-400" />
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {userName}
                                </p>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                                {title}
                            </p>
                            <p className="text-xs text-gray-500">{message}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                <div
                    className="h-full bg-blue-600 transition-all duration-300 ease-linear"
                    style={{
                        width: isVisible ? "100%" : "0%",
                        transitionDuration: `${duration}ms`,
                    }}
                />
            </div>
        </div>
    );
};

export default NotificationToast;
