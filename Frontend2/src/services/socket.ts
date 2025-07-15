import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<any>;
    }
}

window.Pusher = Pusher;

class SocketService {
    private echo: Echo<any> | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    constructor() {
        this.initializeEcho();
    }

    private initializeEcho() {
        try {
            const token = localStorage.getItem("auth_token");
            if (!token) {
                console.warn("No auth token found, cannot initialize Echo");
                return;
            }

            console.log("Initializing Echo with token:", token);
            console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL);
            console.log(
                "Auth endpoint:",
                `${import.meta.env.VITE_API_BASE_URL}/broadcasting/auth`
            );

            this.echo = new Echo({
                broadcaster: "pusher",
                key: import.meta.env.VITE_PUSHER_APP_KEY,
                wsHost: import.meta.env.VITE_PUSHER_HOST,
                wsPort: import.meta.env.VITE_PUSHER_PORT,
                wssPort: import.meta.env.VITE_PUSHER_PORT,
                forceTLS: import.meta.env.VITE_PUSHER_SCHEME === "wss",
                cluster: import.meta.env.VITE_PUSHER_CLUSTER,
                disableStats: true,
                enabledTransports: ["ws", "wss"],
                authEndpoint: `${
                    import.meta.env.VITE_API_BASE_URL
                }/broadcasting/auth`,
                auth: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            });

            console.log("Echo instance created:", this.echo);
            this.setupConnectionHandlers();
        } catch (error) {
            console.error("Failed to initialize Echo:", error);
            this.handleReconnection();
        }
    }

    private setupConnectionHandlers() {
        if (!this.echo) {
            console.error("Cannot setup connection handlers: Echo is null");
            return;
        }
        this.echo.connector.pusher.connection.bind("connecting", () => {
            console.log("WebSocket connecting...");
        });

        this.echo.connector.pusher.connection.bind("connected", () => {
            console.log("WebSocket connected successfully");
            this.reconnectAttempts = 0;
        });

        this.echo.connector.pusher.connection.bind("disconnected", () => {
            console.log("WebSocket disconnected");
            this.handleReconnection();
        });
        this.echo.connector.pusher.connection.bind("error", (error: any) => {
            console.error("WebSocket error:", error);
            this.handleReconnection();
        });

        this.echo.connector.pusher.connection.bind_global(
            (message: any, data: any) => {
                console.log(
                    "-------------------------------------------Received event:",
                    message,
                    data
                );
            }
        );

        this.echo.connector.pusher.connection.bind(
            "state_change",
            (states: any) => {
                console.log("WebSocket state change:", states);
            }
        );
    }

    private handleReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Reconnection attempt ${this.reconnectAttempts}`);
                this.initializeEcho();
            }, 1000 * Math.pow(2, this.reconnectAttempts));
        }
    }

    // Chat channels
    joinChatChannel(
        chatId: string,
        callbacks: {
            onMessage?: (message: any) => void;
            onTyping?: (typing: any) => void;
            onAgentJoined?: (agent: any) => void;
            onAgentLeft?: (agent: any) => void;
        }
    ) {
        if (!this.echo) {
            console.error("Chat: Echo not initialized for chat:", chatId);
            return null;
        }
        const channel = this.echo.private(`chat.${chatId}`);

        // Add debugging for channel subscription
        channel.subscribed(() => {
            console.log(
                "Chat: Successfully subscribed to channel:",
                `chat.${chatId}`
            );
        });

        channel.error((error: any) => {
            console.error("Chat: Channel subscription error:", error);
        });

        if (callbacks.onMessage) {
            console.log("Chat: Setting up MessageSent listener");
            channel.listen(".MessageSent", (data: any) => {
                console.log(
                    "Chat: MessageSent event received - full data:",
                    data
                );
                // Backend sends message data nested under 'message' key
                const message = data.message || data;
                console.log("Chat: Extracted message:", message);
                callbacks.onMessage!(message);
            });
        }

        if (callbacks.onTyping) {
            channel.listen(".UserTyping", (typing: any) => {
                console.log("UserTyping event received - full data:", typing);

                const typingData = typing;

                callbacks.onTyping!(typingData);
            });
        }

        if (callbacks.onAgentJoined) {
            channel.listen(".AgentJoined", (data: any) => {
                console.log("AgentJoined event received:", data);
                callbacks.onAgentJoined!(data.agent || data);
            });
        }

        if (callbacks.onAgentLeft) {
            channel.listen(".AgentLeft", (data: any) => {
                console.log("AgentLeft event received:", data);
                callbacks.onAgentLeft!(data.agent || data);
            });
        }

        return channel;
    }

    leaveChatChannel(chatId: string) {
        if (this.echo) {
            this.echo.leave(`chat.${chatId}`);
            console.log("Chat: Left channel:", `chat.${chatId}`);
        }
    }

    joinAgentChannel(callbacks: {
        onNewChat?: (chat: any) => void;
        onChatUpdate?: (chat: any) => void;
        onMessage?: (message: any) => void;
    }) {
        if (!this.echo) {
            console.error("Agent: Echo not initialized for agent channel");
            return null;
        }

        const channel = this.echo.private("agent.dashboard");

        channel.subscribed(() => {
            console.log("Agent: Successfully subscribed to agent channel");
        });

        channel.error((error: any) => {
            console.error("Agent: Channel subscription error:", error);
            console.error("Error details:", {
                status: error.status,
                data: error.data,
                message: error.message,
            });
        });

        if (callbacks.onNewChat) {
            channel.listen(".ChatCreated", (data: any) => {
                console.log("Agent: ChatCreated event received:", data);
                callbacks.onNewChat!(data.chat || data);
            });
        }

        if (callbacks.onChatUpdate) {
            channel.listen(".ChatUpdated", (data: any) => {
                console.log("Agent: ChatUpdated event received:", data);
                callbacks.onChatUpdate!(data.chat || data);
            });
        }

        if (callbacks.onMessage) {
            channel.listen(".MessageSent", (data: any) => {
                console.log("Agent: MessageSent event received:", data);
                const message = data.message || data;
                callbacks.onMessage!(message);
            });
        }

        return channel;
    }

    leaveAgentChannel() {
        if (this.echo) {
            this.echo.leave("agent.dashboard");
            console.log("Agent: Left agent channel");
        }
    }

    joinPresenceChannel(
        channelName: string,
        callbacks: {
            onHere?: (users: any[]) => void;
            onJoining?: (user: any) => void;
            onLeaving?: (user: any) => void;
        }
    ) {
        if (!this.echo) {
            console.error(
                "Presence: Echo not initialized for presence channel"
            );
            return null;
        }

        const channel = this.echo.join(channelName);

        channel.here((users: any[]) => {
            console.log("Presence: Users currently in channel:", users);
            if (callbacks.onHere) {
                callbacks.onHere(users);
            }
        });

        channel.joining((user: any) => {
            console.log("Presence: User joined channel:", user);
            if (callbacks.onJoining) {
                callbacks.onJoining(user);
            }
        });

        channel.leaving((user: any) => {
            console.log("Presence: User left channel:", user);
            if (callbacks.onLeaving) {
                callbacks.onLeaving(user);
            }
        });

        return channel;
    }

    leavePresenceChannel(channelName: string) {
        if (this.echo) {
            this.echo.leave(channelName);
            console.log("Presence: Left channel:", channelName);
        }
    }

    isConnected(): boolean {
        return this.echo?.connector.pusher.connection.state === "connected";
    }

    disconnect() {
        if (this.echo) {
            this.echo.disconnect();
            this.echo = null;
            console.log("Socket service disconnected");
        }
    }

    reconnect() {
        this.disconnect();
        this.reconnectAttempts = 0;
        this.initializeEcho();
    }

    updateAuthToken(token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.echo) {
                console.warn("Cannot update auth token: Echo not initialized");
                resolve();
                return;
            }

            try {
                // Update the auth headers
                this.echo.connector.options.auth.headers.Authorization = `Bearer ${token}`;
                console.log("Auth token updated in Echo");
                resolve();
            } catch (error) {
                console.error("Failed to update auth token:", error);
                reject(error);
            }
        });
    }

    ensureConnection() {
        if (!this.echo || !this.isConnected()) {
            console.log("Ensuring socket connection...");
            this.initializeEcho();
        }
    }
}

export default new SocketService();
