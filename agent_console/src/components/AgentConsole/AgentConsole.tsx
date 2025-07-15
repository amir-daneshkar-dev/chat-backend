import React, { useState, useEffect, useCallback, useRef } from "react";
import { Users, LogOut, Search } from "lucide-react";
import ChatList from "./ChatList";
import ChatSession from "./ChatSession";
import NotificationManager from "../shared/NotificationManager";
import ConfirmationModal from "../shared/ConfirmationModal";
import NotificationDropdown from "../shared/NotificationDropdown";
import { Chat, Agent } from "../../types";
import apiService from "../../services/api";
import socketService from "../../services/socket";
import authService from "../../services/auth";
import notificationService from "../../services/notification";

interface AgentConsoleProps {
    className?: string;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    userName: string;
    chatId: string;
    timestamp: number;
}

const AgentConsole: React.FC<AgentConsoleProps> = ({ className = "" }) => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
    const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [typingStatuses, setTypingStatuses] = useState<any[]>([]);
    const [typingTimeouts, setTypingTimeouts] = useState<Map<string, number>>(
        new Map()
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<
        "all" | "waiting" | "active" | "closed"
    >("all");
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const [socketInitialized, setSocketInitialized] = useState(false);

    // Modal state
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [chatToClose, setChatToClose] = useState<string | null>(null);

    // Notification dropdown state
    const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
        useState(false);

    // Ref to access current agent in callbacks
    const currentAgentRef = useRef<Agent | null>(null);

    // Initialize agent and load chats
    useEffect(() => {
        if (socketInitialized) {
            return; // Prevent multiple initializations
        }

        const initializeAgent = async () => {
            try {
                const agent = authService.getUser() as Agent;
                setCurrentAgent(agent);
                currentAgentRef.current = agent;

                // Load chats
                const chatsData = await apiService.getAgentChats();
                setChats(Array.isArray(chatsData) ? chatsData : []);

                // Ensure socket connection is established
                socketService.ensureConnection();

                // Setup socket listeners
                console.log("Agent: Joining agent channel");
                const agentChannel = socketService.joinAgentChannel({
                    onNewChat: (chat: Chat) => {
                        console.log("Agent: New chat received:", chat);
                        console.log("Agent: Chat ID:", chat.id);
                        console.log("Agent: Chat user:", chat.user);

                        // Ensure chat has required properties
                        if (!chat.id || !chat.user) {
                            console.error(
                                "Agent: Invalid chat data received:",
                                chat
                            );
                            return;
                        }

                        // Ensure chat has all required fields for the ChatList component
                        const completeChat: Chat = {
                            id: chat.id,
                            user: chat.user,
                            agent: chat.agent,
                            messages: chat.messages || [],
                            status: chat.status || "waiting",
                            queuePosition: chat.queuePosition,
                            createdAt: chat.createdAt
                                ? new Date(chat.createdAt)
                                : new Date(),
                            updatedAt: chat.updatedAt
                                ? new Date(chat.updatedAt)
                                : new Date(),
                            unreadCount: chat.unreadCount || 0,
                        };

                        setChats((prev) => {
                            // Check if chat already exists to prevent duplicates
                            const existingChat = prev.find(
                                (c) => c.id === completeChat.id
                            );
                            if (existingChat) {
                                console.log(
                                    "Agent: Chat already exists, updating instead"
                                );
                                return prev.map((c) =>
                                    c.id === completeChat.id ? completeChat : c
                                );
                            }
                            return [completeChat, ...prev];
                        });
                    },
                    onNewChatNotification: (notificationData: any) => {
                        console.log(
                            "Agent: New chat notification received:",
                            notificationData
                        );

                        // Create notification from the received data
                        const notification: Notification = {
                            id: `notification-${
                                notificationData.id
                            }-${Date.now()}-${Math.random()}`,
                            title: notificationData.title || "New Chat Request",
                            message:
                                notificationData.message ||
                                "A new chat has been created and is waiting for an agent",
                            userName:
                                notificationData.userName ||
                                notificationData.user?.name ||
                                "Unknown User",
                            chatId:
                                notificationData.chatId || notificationData.id,
                            timestamp: Date.now(),
                        };

                        console.log(
                            "Agent: Creating notification from event:",
                            notification
                        );

                        // Use functional update to check for duplicates
                        setNotifications((prev) => {
                            // Check if notification already exists to prevent duplicates
                            const existingNotification = prev.find(
                                (n) =>
                                    n.chatId ===
                                    (notificationData.chatId ||
                                        notificationData.id)
                            );

                            if (existingNotification) {
                                console.log(
                                    "Agent: Notification already exists, skipping"
                                );
                                return prev;
                            }

                            return [...prev, notification];
                        });

                        // Show desktop notification if permission is granted
                        const currentPermission =
                            notificationService.getPermissionStatus();
                        if (currentPermission === "granted") {
                            notificationService.showChatNotification(
                                notification.userName,
                                notification.chatId
                            );
                        }
                    },
                    onChatUpdate: (updatedChat: Chat) => {
                        console.log(
                            "Agent: Chat update received:",
                            updatedChat.id,
                            "status:",
                            updatedChat.status,
                            "agent:",
                            updatedChat.agent,
                            "full data:",
                            updatedChat
                        );

                        setChats((prev) => {
                            const existingChat = prev.find(
                                (c) => c.id === updatedChat.id
                            );

                            // If the chat is now assigned to another agent and we're not that agent,
                            // remove it from our list
                            if (
                                updatedChat.status === "active" &&
                                updatedChat.agent &&
                                updatedChat.agent.id !==
                                    currentAgentRef.current?.id
                            ) {
                                console.log(
                                    "Agent: Chat assigned to another agent, removing from list:",
                                    updatedChat.id
                                );
                                return prev.filter(
                                    (c) => c.id !== updatedChat.id
                                );
                            }

                            // If the chat is now assigned to us, update it in our list
                            if (
                                updatedChat.status === "active" &&
                                updatedChat.agent &&
                                updatedChat.agent.id ===
                                    currentAgentRef.current?.id
                            ) {
                                console.log(
                                    "Agent: Chat assigned to us, updating in list:",
                                    updatedChat.id
                                );
                                // Merge the updated chat with existing chat data to preserve missing fields
                                const mergedChat = existingChat
                                    ? {
                                          ...existingChat,
                                          ...updatedChat,
                                          // Ensure we have all required fields
                                          user:
                                              updatedChat.user ||
                                              existingChat.user,
                                          messages:
                                              updatedChat.messages ||
                                              existingChat.messages ||
                                              [],
                                          createdAt:
                                              updatedChat.createdAt ||
                                              existingChat.createdAt,
                                          updatedAt:
                                              updatedChat.updatedAt ||
                                              existingChat.updatedAt,
                                          unreadCount:
                                              updatedChat.unreadCount ||
                                              existingChat.unreadCount ||
                                              0,
                                      }
                                    : updatedChat;

                                return prev.map((c) =>
                                    c.id === updatedChat.id ? mergedChat : c
                                );
                            }

                            // For other updates, merge with existing data
                            if (existingChat) {
                                const mergedChat = {
                                    ...existingChat,
                                    ...updatedChat,
                                    // Ensure we have all required fields
                                    user: updatedChat.user || existingChat.user,
                                    messages:
                                        updatedChat.messages ||
                                        existingChat.messages ||
                                        [],
                                    createdAt:
                                        updatedChat.createdAt ||
                                        existingChat.createdAt,
                                    updatedAt:
                                        updatedChat.updatedAt ||
                                        existingChat.updatedAt,
                                    unreadCount:
                                        updatedChat.unreadCount ||
                                        existingChat.unreadCount ||
                                        0,
                                };

                                return prev.map((c) =>
                                    c.id === updatedChat.id ? mergedChat : c
                                );
                            }

                            // If no existing chat, just add the new one
                            return [...prev, updatedChat];
                        });
                    },
                    onMessage: (message: any) => {
                        console.log(
                            "Agent: Message received for chat:",
                            message.chatId,
                            "full data:",
                            message
                        );
                        setChats((prev) =>
                            prev.map((chat) =>
                                chat.id === message.chatId
                                    ? {
                                          ...chat,
                                          messages: chat.messages.some(
                                              (m) => m.id === message.id
                                          )
                                              ? chat.messages
                                              : [...chat.messages, message],
                                      }
                                    : chat
                            )
                        );
                    },
                });

                if (!agentChannel) {
                    console.error("Agent: Failed to join agent channel");
                } else {
                    console.log("Agent: Successfully joined agent channel");
                    setSocketInitialized(true);
                }
            } catch (error) {
                console.error("Failed to initialize agent console:", error);
                // Ensure chats is always an array even on error
                setChats([]);
            } finally {
                setLoading(false);
            }
        };

        initializeAgent();

        return () => {
            socketService.leaveAgentChannel();
        };
    }, [socketInitialized]);

    // Cleanup chat channel when component unmounts
    useEffect(() => {
        return () => {
            if (selectedChatId) {
                socketService.leaveChatChannel(selectedChatId);
            }
        };
    }, [selectedChatId]);

    // Monitor typing statuses changes
    useEffect(() => {
        console.log("Agent: Typing statuses changed:", typingStatuses);
    }, [typingStatuses]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Clear all typing timeouts
            typingTimeouts.forEach((timeout) => {
                clearTimeout(timeout);
            });
        };
    }, [typingTimeouts]);

    const handleChatSelect = useCallback(
        (chatId: string) => {
            // Leave previous chat channel if any
            if (selectedChatId) {
                console.log(
                    "Agent: Leaving previous chat channel:",
                    selectedChatId
                );
                socketService.leaveChatChannel(selectedChatId);
            }

            setSelectedChatId(chatId);

            // Join the specific chat channel for this chat
            console.log("Agent: Joining chat channel:", chatId);
            socketService.joinChatChannel(chatId, {
                onMessage: (message: any) => {
                    console.log(
                        "Agent: Message received for chat:",
                        chatId,
                        "full data:",
                        message
                    );
                    setChats((prev) =>
                        prev.map((chat) =>
                            chat.id === chatId
                                ? {
                                      ...chat,
                                      messages: chat.messages.some(
                                          (m) => m.id === message.id
                                      )
                                          ? chat.messages
                                          : [...chat.messages, message],
                                  }
                                : chat
                        )
                    );
                },
                onTyping: (typing: any) => {
                    // Clear existing timeout for this user if it exists
                    const timeoutKey = `${typing.chatId}-${typing.userId}`;
                    const existingTimeout = typingTimeouts.get(timeoutKey);
                    if (existingTimeout) {
                        clearTimeout(existingTimeout);
                    }

                    setTypingStatuses((prev) => {
                        console.log("Agent: Previous typing statuses:", prev);
                        const filtered = prev.filter(
                            (t) =>
                                t.chatId !== typing.chatId ||
                                t.userId !== typing.userId
                        );
                        const newStatuses = typing.isTyping
                            ? [...filtered, typing]
                            : filtered;
                        return newStatuses;
                    });

                    // Set new timeout to clear typing status after 5 seconds
                    if (typing.isTyping) {
                        const newTimeout = setTimeout(() => {
                            console.log(
                                "Agent: Clearing typing status for timeout:",
                                timeoutKey
                            );
                            setTypingStatuses((prev) =>
                                prev.filter(
                                    (t) =>
                                        t.chatId !== typing.chatId ||
                                        t.userId !== typing.userId
                                )
                            );
                            setTypingTimeouts((prev) => {
                                const newMap = new Map(prev);
                                newMap.delete(timeoutKey);
                                return newMap;
                            });
                        }, 5000);

                        setTypingTimeouts((prev) => {
                            const newMap = new Map(prev);
                            newMap.set(timeoutKey, newTimeout);
                            return newMap;
                        });
                    } else {
                        // Remove timeout if typing stopped
                        setTypingTimeouts((prev) => {
                            const newMap = new Map(prev);
                            newMap.delete(timeoutKey);
                            return newMap;
                        });
                    }
                },
                onAgentJoined: (agent) => {
                    console.log(
                        "Agent: Agent joined event for chat:",
                        chatId,
                        agent
                    );
                    setChats((prev) =>
                        prev.map((chat) =>
                            chat.id === chatId ? { ...chat, agent } : chat
                        )
                    );
                },
                onAgentLeft: () => {
                    console.log("Agent: Agent left event for chat:", chatId);
                    setChats((prev) =>
                        prev.map((chat) =>
                            chat.id === chatId
                                ? { ...chat, agent: undefined }
                                : chat
                        )
                    );
                },
            });

            // Mark chat as active if it was waiting
            const chat = chats.find((c) => c.id === chatId);
            if (chat && chat.status === "waiting") {
                apiService.assignChatToAgent(chatId).then(() => {
                    setChats((prev) =>
                        prev.map((c) =>
                            c.id === chatId
                                ? {
                                      ...c,
                                      status: "active" as const,
                                      agent:
                                          currentAgentRef.current || undefined,
                                  }
                                : c
                        )
                    );
                });
            }
        },
        [chats, selectedChatId]
    );

    const handleSendMessage = useCallback(
        async (content: string) => {
            if (!selectedChatId) return;

            try {
                console.log("Agent: Sending message:", {
                    content,
                    selectedChatId,
                });

                const message = await apiService.sendMessage(selectedChatId, {
                    content,
                    type: "text",
                });

                console.log("Agent: Message sent successfully:", message);

                // Ensure the message has all required fields
                const formattedMessage = {
                    ...message,
                    isAgent: true, // This is an agent message
                    timestamp: message?.timestamp
                        ? new Date(message.timestamp)
                        : new Date(),
                    isRead: message?.isRead || false,
                };

                setChats((prev) => {
                    console.log("Agent: Updating chats with new message:", {
                        prev,
                        formattedMessage,
                    });
                    return prev.map((chat) =>
                        chat.id === selectedChatId
                            ? {
                                  ...chat,
                                  messages: chat.messages.some(
                                      (m) => m.id === formattedMessage.id
                                  )
                                      ? chat.messages
                                      : [...chat.messages, formattedMessage],
                              }
                            : chat
                    );
                });
            } catch (error) {
                console.error("Failed to send message:", error);
                // Add user-friendly error handling
                alert(
                    `Failed to send message: ${
                        error instanceof Error ? error.message : "Unknown error"
                    }`
                );
            }
        },
        [selectedChatId]
    );

    const handleFileUpload = useCallback(
        async (file: File) => {
            if (!selectedChatId) return;

            try {
                const uploadResult = await apiService.uploadFile(
                    file,
                    selectedChatId
                );

                console.log("Agent: Upload result:", uploadResult);

                // Handle different possible response structures
                const fileUrl =
                    uploadResult?.url ||
                    uploadResult?.file_url ||
                    uploadResult?.path ||
                    uploadResult;

                if (!fileUrl) {
                    throw new Error("Upload failed: No file URL received");
                }

                const messageData = {
                    content: file.name,
                    type: file.type.startsWith("image/") ? "image" : "file",
                    file_url: fileUrl,
                    file_name: file.name,
                    file_size: file.size,
                };

                const message = await apiService.sendMessage(
                    selectedChatId,
                    messageData
                );

                // Ensure the message has all required fields
                const formattedMessage = {
                    ...message,
                    isAgent: true, // This is an agent message
                    timestamp: message?.timestamp
                        ? new Date(message.timestamp)
                        : new Date(),
                    isRead: message?.isRead || false,
                };

                setChats((prev) =>
                    prev.map((chat) =>
                        chat.id === selectedChatId
                            ? {
                                  ...chat,
                                  messages: chat.messages.some(
                                      (m) => m.id === formattedMessage.id
                                  )
                                      ? chat.messages
                                      : [...chat.messages, formattedMessage],
                              }
                            : chat
                    )
                );
            } catch (error) {
                console.error("Failed to upload file:", error);
            }
        },
        [selectedChatId]
    );

    const handleVoiceMessage = useCallback(
        async (audioBlob: Blob, duration: number) => {
            if (!selectedChatId) return;

            try {
                const file = new File([audioBlob], "voice-message.webm", {
                    type: "audio/webm",
                });
                const uploadResult = await apiService.uploadFile(
                    file,
                    selectedChatId
                );

                console.log("Agent: Voice upload result:", uploadResult);

                // Handle different possible response structures
                const fileUrl =
                    uploadResult?.url ||
                    uploadResult?.file_url ||
                    uploadResult?.path ||
                    uploadResult;

                if (!fileUrl) {
                    throw new Error(
                        "Voice upload failed: No file URL received"
                    );
                }

                const messageData = {
                    content: "Voice message",
                    type: "voice",
                    file_url: fileUrl,
                    voice_duration: duration,
                };

                const message = await apiService.sendMessage(
                    selectedChatId,
                    messageData
                );

                // Ensure the message has all required fields
                const formattedMessage = {
                    ...message,
                    isAgent: true, // This is an agent message
                    timestamp: message?.timestamp
                        ? new Date(message.timestamp)
                        : new Date(),
                    isRead: message?.isRead || false,
                };

                setChats((prev) =>
                    prev.map((chat) =>
                        chat.id === selectedChatId
                            ? {
                                  ...chat,
                                  messages: chat.messages.some(
                                      (m) => m.id === formattedMessage.id
                                  )
                                      ? chat.messages
                                      : [...chat.messages, formattedMessage],
                              }
                            : chat
                    )
                );
            } catch (error) {
                console.error("Failed to send voice message:", error);
            }
        },
        [selectedChatId]
    );

    const handleTyping = useCallback(
        async (isTyping: boolean) => {
            if (!selectedChatId) return;

            try {
                await apiService.sendTypingStatus(selectedChatId, isTyping);
            } catch (error) {
                console.error("Failed to send typing status:", error);
            }
        },
        [selectedChatId]
    );

    const handleMarkAsRead = useCallback(async (messageId: string) => {
        try {
            await apiService.markMessageAsRead(messageId);
            setChats((prev) =>
                prev.map((chat) => ({
                    ...chat,
                    messages: chat.messages.map((msg) =>
                        msg.id === messageId ? { ...msg, isRead: true } : msg
                    ),
                }))
            );
        } catch (error) {
            console.error("Failed to mark message as read:", error);
        }
    }, []);

    const handleCloseChat = useCallback(async (chatId: string) => {
        // Set the chat to close and open the modal
        setChatToClose(chatId);
        setIsCloseModalOpen(true);
    }, []);

    const handleConfirmCloseChat = useCallback(async () => {
        if (!chatToClose) return;

        try {
            console.log("Agent: Closing chat:", chatToClose);

            // Call the API to close the chat
            const updatedChat = await apiService.closeChatAsAgent(chatToClose);

            // Update the chat in the list
            setChats((prev) =>
                prev.map((chat) =>
                    chat.id === chatToClose
                        ? { ...chat, status: "closed" as const }
                        : chat
                )
            );

            // Clear the selected chat if it's the one being closed
            if (selectedChatId === chatToClose) {
                setSelectedChatId(undefined);
            }

            console.log("Agent: Chat closed successfully:", chatToClose);
        } catch (error) {
            console.error("Failed to close chat:", error);
            // Show user-friendly error message
            alert(
                `Failed to close chat: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        } finally {
            // Reset modal state
            setChatToClose(null);
            setIsCloseModalOpen(false);
        }
    }, [chatToClose, selectedChatId]);

    const handleLogout = useCallback(async () => {
        try {
            await apiService.logout();
            authService.logout();
            window.location.reload();
        } catch (error) {
            console.error("Failed to logout:", error);
        }
    }, []);

    // Notification handlers
    const handleNotificationClose = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const handleNotificationClick = useCallback((chatId: string) => {
        setSelectedChatId(chatId);
        // Remove the notification after clicking
        setNotifications((prev) => prev.filter((n) => n.chatId !== chatId));
    }, []);

    // Listen for desktop notification clicks
    useEffect(() => {
        const handleOpenChat = (event: CustomEvent) => {
            const { chatId } = event.detail;
            handleNotificationClick(chatId);
        };

        window.addEventListener("openChat", handleOpenChat as EventListener);

        return () => {
            window.removeEventListener(
                "openChat",
                handleOpenChat as EventListener
            );
        };
    }, [handleNotificationClick]);

    const filteredChats = (chats || []).filter((chat) => {
        // Safety check for chat structure
        if (!chat || !chat.user || !chat.user.name || !chat.user.email) {
            console.warn("Agent: Invalid chat structure:", chat);
            return false;
        }

        const matchesSearch =
            chat.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            chat.user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            statusFilter === "all" || chat.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const selectedChat = selectedChatId
        ? (chats || []).find((c) => c && c.id === selectedChatId)
        : undefined;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading agent console...</p>
                </div>
            </div>
        );
    }

    // Add error boundary for debugging
    if (!chats || !Array.isArray(chats)) {
        console.error(
            "Agent: Chats is null, undefined, or not an array:",
            chats
        );
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-red-600">
                        Error: Chats data is missing or invalid
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-screen flex flex-col bg-gray-50 ${className}`}>
            {/* Notifications */}
            <NotificationManager
                notifications={notifications}
                onClose={handleNotificationClose}
                onClick={handleNotificationClick}
            />

            {/* Header */}
            <header className="bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Agent Console
                            </h1>
                            <p className="text-sm text-gray-500">
                                Welcome back, {currentAgent?.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <NotificationDropdown
                            isOpen={isNotificationDropdownOpen}
                            onToggle={() =>
                                setIsNotificationDropdownOpen(
                                    !isNotificationDropdownOpen
                                )
                            }
                            onClose={() => setIsNotificationDropdownOpen(false)}
                        />

                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 flex flex-col">
                    {/* Search and Filter */}
                    <div className="p-4 bg-white border-b">
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search chats..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex space-x-2">
                                {["all", "waiting", "active", "closed"].map(
                                    (status) => (
                                        <button
                                            key={status}
                                            onClick={() =>
                                                setStatusFilter(status as any)
                                            }
                                            className={`
                      px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors
                      ${
                          statusFilter === status
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    `}
                                        >
                                            {status}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chat List */}
                    <ChatList
                        chats={filteredChats}
                        selectedChatId={selectedChatId}
                        onChatSelect={handleChatSelect}
                        className="flex-1"
                    />
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedChat ? (
                        <ChatSession
                            chat={selectedChat}
                            onSendMessage={handleSendMessage}
                            onFileUpload={handleFileUpload}
                            onVoiceMessage={handleVoiceMessage}
                            onTyping={handleTyping}
                            onMarkAsRead={handleMarkAsRead}
                            onCloseChat={handleCloseChat}
                            typingStatuses={typingStatuses}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <Users className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                    Select a chat to start
                                </h2>
                                <p className="text-gray-500">
                                    Choose a conversation from the sidebar to
                                    begin helping customers
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Close Chat Confirmation Modal */}
            <ConfirmationModal
                isOpen={isCloseModalOpen}
                onClose={() => {
                    setIsCloseModalOpen(false);
                    setChatToClose(null);
                }}
                onConfirm={handleConfirmCloseChat}
                title="Close Chat"
                message="Are you sure you want to close this chat? This action cannot be undone."
                confirmText="Close Chat"
                cancelText="Cancel"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </div>
    );
};

export default AgentConsole;
