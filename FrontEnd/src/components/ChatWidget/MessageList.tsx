import React, { useEffect, useRef } from "react";
import { format } from "date-fns";
import {
    Download,
    Play,
    Pause,
    FileText,
    Image as ImageIcon,
    Check,
    CheckCheck,
} from "lucide-react";
import { Message } from "../../types";
import VoiceMessage from "./VoiceMessage";

interface MessageListProps {
    messages: Message[];
    onMarkAsRead: (messageId: string) => void;
    className?: string;
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    onMarkAsRead,
    className = "",
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const formatTime = (date: Date) => {
        return format(new Date(date), "HH:mm");
    };

    const renderMessage = (message: Message) => {
        const isAgent = message.isAgent;

        console.log("messagelist", message);

        return (
            <div
                className={`flex ${
                    isAgent ? "justify-start" : "justify-end"
                } mb-4`}
            >
                <div
                    className={`
            max-w-xs lg:max-w-md px-4 py-2 rounded-lg
            ${isAgent ? "bg-gray-100 text-gray-900" : "bg-blue-600 text-white"}
          `}
                >
                    {message.type === "text" && (
                        <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                        </p>
                    )}

                    {message.type === "image" && (
                        <div className="space-y-2">
                            <img
                                src={message.file_url}
                                alt={message.file_name}
                                className="rounded-lg max-w-full h-auto"
                            />
                            <p className="text-xs opacity-75">
                                {message.file_name}
                            </p>
                        </div>
                    )}

                    {message.type === "file" && (
                        <div className="flex items-center space-x-2">
                            <FileText className="h-6 w-6 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {message.file_name}
                                </p>
                                <p className="text-xs opacity-75">
                                    {message.file_size &&
                                        `${(message.file_size / 1024).toFixed(
                                            1
                                        )} KB`}
                                </p>
                            </div>
                            <a
                                href={message.file_url}
                                download={message.file_name}
                                className="p-1 hover:bg-black/10 rounded"
                            >
                                <Download className="h-4 w-4" />
                            </a>
                        </div>
                    )}

                    {message.type === "voice" && (
                        <VoiceMessage message={message} />
                    )}

                    {message.type === "system" && (
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
                    <p className="text-gray-500">
                        No messages yet. Start a conversation!
                    </p>
                </div>
            ) : (
                messages.map((message) => (
                    <React.Fragment key={message.id}>
                        {renderMessage(message)}
                    </React.Fragment>
                ))
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
