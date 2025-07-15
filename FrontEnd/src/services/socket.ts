import Echo from "laravel-echo";
import Pusher from "pusher-js";
import demoSocket from "./demoSocket";

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
    private isDemoMode: boolean;

    constructor() {
        this.isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

        if (this.isDemoMode) {
            console.log("🎭 Socket running in DEMO MODE");
        } else {
            this.initializeEcho();
        }
    }

    private initializeEcho() {
        try {
            const token = localStorage.getItem("auth_token");
            if (!token) {
                console.warn("No auth token found, cannot initialize Echo");
                return;
            }

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

        // this.echo.connector.pusher.connection.bind((states: any) => {
        //   console.log('=======Message message:', states);
        // });

        this.echo.connector.pusher.connection.bind(
            "state_change",
            (states: any) => {
                console.log("WeuploadFilebSocket state change:", states);
            }
        );
    }

    private handleReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(
                    `ReconuploadFilenection attempt ${this.reconnectAttempts}`
                );
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
        if (this.isDemoMode) {
            return demoSocket.joinChatChannel(chatId, callbacks);
        }

        if (!this.echo) {
            console.error("Chat: Echo not initialized for chat:", chatId);
            return null;
        }

        // Ensure connection is established before joining channel
        if (this.echo.connector.pusher.connection.state !== "connected") {
            console.log(
                "Chat: Waiting for connection before joining channel:",
                chatId
            );
            return new Promise((resolve) => {
                const checkConnection = () => {
                    if (
                        this.echo?.connector.pusher.connection.state ===
                        "connected"
                    ) {
                        console.log(
                            "Chat: Connection established, joining channel:",
                            chatId
                        );
                        resolve(this.setupChatChannel(chatId, callbacks));
                    } else {
                        setTimeout(checkConnection, 100);
                    }
                };
                checkConnection();
            });
        }

        return this.setupChatChannel(chatId, callbacks);
    }

    private setupChatChannel(
        chatId: string,
        callbacks: {
            onMessage?: (message: any) => void;
            onTyping?: (typing: any) => void;
            onAgentJoined?: (agent: any) => void;
            onAgentLeft?: (agent: any) => void;
        }
    ) {
        const channel = this.echo!.private(`chat.${chatId}`);

        // Add debugging for channel subscription
        channel.subscribed(() => {
            console.log(
                "Chat: Successfully subscribed to channel:",
                `chat.${chatId}`
            );
        });

        channel.error((error: any) => {
            console.error("Chat: Channel subscription error:", error);
            // Try to reconnect if subscription fails
            if (error.status === 403) {
                console.log(
                    "Chat: Authorization failed, trying to reconnect..."
                );
                this.reconnect();
            }
        });

        // Listen for all events on this channel for debugging
        channel.listen(".", (event: any) => {
            console.log("Chat: Received event on channel:", event);
        });

        // Also try listening for all events without any prefix
        channel.listen("*", (event: any) => {
            console.log("Chat: Received wildcard event on channel:", event);
        });

        // Also listen for the specific event name that Laravel broadcasts
        channel.listen(".UserTyping", (typing: any) => {
            console.log(
                "Chat: UserTyping event received via specific listener:",
                typing
            );
        });

        // Add a comprehensive event listener that logs all events
        channel.listen("*", (eventName: string, data: any) => {
            console.log(
                `Chat: Comprehensive listener caught event "${eventName}":`,
                data
            );

            // Handle events based on their name
            if (eventName === "MessageSent" || eventName === ".MessageSent") {
                console.log(
                    "Chat: MessageSent event caught by comprehensive listener"
                );
                if (callbacks.onMessage) {
                    const message = data.message || data;
                    callbacks.onMessage(message);
                }
            } else if (
                eventName === "UserTyping" ||
                eventName === ".UserTyping"
            ) {
                console.log(
                    "Chat: UserTyping event caught by comprehensive listener"
                );
                if (callbacks.onTyping) {
                    callbacks.onTyping(data);
                }
            } else if (
                eventName === "AgentJoined" ||
                eventName === ".AgentJoined"
            ) {
                console.log(
                    "Chat: AgentJoined event caught by comprehensive listener"
                );
                if (callbacks.onAgentJoined) {
                    const agent = data.agent || data;
                    callbacks.onAgentJoined(agent);
                }
            }
        });

        // Try listening without the event name (Laravel Echo might handle this differently)
        // channel.listen((event: any) => {
        //   console.log('Chat: Received event via generic listener:', event);
        // });

        if (callbacks.onMessage) {
            console.log("Chat: Setting up MessageSent listener");
            // Try multiple event name patterns
            channel.listen("MessageSent", (data: any) => {
                console.log(
                    "Chat: MessageSent event received - full data:",
                    data
                );
                // Backend sends message data nested under 'message' key
                const message = data.message || data;
                console.log("Chat: Extracted message:", message);
                callbacks.onMessage!(message);
            });

            // Also try with dot prefix
            channel.listen(".MessageSent", (data: any) => {
                console.log(
                    "Chat: .MessageSent event received - full data:",
                    data
                );
                const message = data.message || data;
                console.log("Chat: Extracted message:", message);
                callbacks.onMessage!(message);
            });
        }

        if (callbacks.onTyping) {
            console.log("Chat: Setting up UserTyping listener");
            // Try multiple event name patterns
            channel.listen("UserTyping", (typing: any) => {
                console.log(
                    "Chat: UserTyping event received - full data:",
                    typing
                );
                callbacks.onTyping!(typing);
            });

            // Also try with dot prefix
            channel.listen(".UserTyping", (typing: any) => {
                console.log(
                    "Chat: .UserTyping event received - full data:",
                    typing
                );
                callbacks.onTyping!(typing);
            });
        }

        if (callbacks.onAgentJoined) {
            console.log("Chat: Setting up AgentJoined listener");
            // Try multiple event name patterns
            channel.listen("AgentJoined", (data: any) => {
                console.log("Chat: AgentJoined event received:", data);
                const agent = data.agent || data;
                callbacks.onAgentJoined!(agent);
            });

            // Also try with dot prefix
            channel.listen(".AgentJoined", (data: any) => {
                console.log("Chat: .AgentJoined event received:", data);
                const agent = data.agent || data;
                callbacks.onAgentJoined!(agent);
            });
        }

        if (callbacks.onAgentLeft) {
            channel.listen(".AgentLeft", (data: any) => {
                console.log("Chat: AgentLeft event received:", data);
                // Backend sends agent data nested under 'agent' key
                const agent = data.agent || data;
                callbacks.onAgentLeft!(agent);
            });
        }

        console.log("Chat: Successfully set up channel listeners for:", chatId);
        return channel;
    }

    leaveChatChannel(chatId: string) {
        if (this.isDemoMode) {
            return demoSocket.leaveChatChannel(chatId);
        }

        if (!this.echo) return;
        this.echo.leave(`chat.${chatId}`);
    }

    // Agent channels
    joinAgentChannel(callbacks: {
        onNewChat?: (chat: any) => void;
        onChatUpdate?: (chat: any) => void;
        onMessage?: (message: any) => void;
    }) {
        if (this.isDemoMode) {
            return demoSocket.joinAgentChannel(callbacks);
        }

        if (!this.echo) {
            console.error("Agent: Echo not initialized");
            return null;
        }

        console.log("Agent: Attempting to join agent.dashboard channel");
        const channel = this.echo.private("agent.dashboard");

        if (callbacks.onNewChat) {
            channel.listen(".NewChatAssigned", (data: any) => {
                console.log("Agent: NewChatAssigned event received:", data);
                // Backend sends chat data nested under 'chat' key
                const chat = data.chat || data;
                callbacks.onNewChat!(chat);
            });
        }

        if (callbacks.onChatUpdate) {
            channel.listen(".ChatUpdated", (data: any) => {
                console.log("Agent: ChatUpdated event received:", data);
                // Backend sends chat data nested under 'chat' key
                const chat = data.chat || data;
                callbacks.onChatUpdate!(chat);
            });
        }

        if (callbacks.onMessage) {
            channel.listen(".MessageSent", (data: any) => {
                console.log(
                    "Agent: MessageSent event received - full data:",
                    data
                );
                // Backend sends message data nested under 'message' key
                const message = data.message || data;
                console.log("Agent: Extracted message:", message);
                callbacks.onMessage!(message);
            });
        }

        console.log("Agent: Successfully set up agent channel listeners");
        return channel;
    }

    leaveAgentChannel() {
        if (this.isDemoMode) {
            return demoSocket.leaveAgentChannel();
        }

        if (!this.echo) return;
        this.echo.leave("agent.dashboard");
    }

    // Presence channels
    joinPresenceChannel(
        channelName: string,
        callbacks: {
            onHere?: (users: any[]) => void;
            onJoining?: (user: any) => void;
            onLeaving?: (user: any) => void;
        }
    ) {
        if (this.isDemoMode) {
            return demoSocket.joinPresenceChannel(channelName, callbacks);
        }

        if (!this.echo) return null;

        const channel = this.echo.join(channelName);

        if (callbacks.onHere) {
            channel.here(callbacks.onHere);
        }

        if (callbacks.onJoining) {
            channel.joining(callbacks.onJoining);
        }

        if (callbacks.onLeaving) {
            channel.leaving(callbacks.onLeaving);
        }

        return channel;
    }

    leavePresenceChannel(channelName: string) {
        if (this.isDemoMode) {
            return demoSocket.leavePresenceChannel(channelName);
        }

        if (!this.echo) return;
        this.echo.leave(channelName);
    }

    // Utility methods
    isConnected(): boolean {
        if (this.isDemoMode) {
            return demoSocket.isConnected();
        }

        return this.echo?.connector?.pusher?.connection?.state === "connected";
    }

    disconnect() {
        if (this.isDemoMode) {
            return demoSocket.disconnect();
        }

        if (this.echo) {
            this.echo.disconnect();
            this.echo = null;
        }
    }

    reconnect() {
        if (this.isDemoMode) {
            return demoSocket.reconnect();
        }

        this.disconnect();
        this.initializeEcho();
    }

    // Update auth token and reinitialize Echo
    updateAuthToken(token: string): Promise<void> {
        if (this.isDemoMode) return Promise.resolve();

        console.log("Updating auth token:", token);

        // Store the new token
        localStorage.setItem("auth_token", token);

        // Disconnect existing connection
        if (this.echo) {
            this.echo.disconnect();
            this.echo = null;
        }

        // Reinitialize with new token
        this.initializeEcho();

        // Return a promise that resolves when connection is established
        return new Promise((resolve, reject) => {
            const maxAttempts = 10;
            let attempts = 0;

            const checkConnection = () => {
                attempts++;

                if (
                    this.echo &&
                    this.echo.connector.pusher.connection.state === "connected"
                ) {
                    console.log("Socket connection established with new token");
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error(
                        "Failed to establish connection with new token"
                    );
                    reject(new Error("Connection timeout"));
                } else {
                    setTimeout(checkConnection, 500);
                }
            };

            checkConnection();
        });
    }

    // Ensure connection is established
    ensureConnection() {
        if (this.isDemoMode) return;

        const token = localStorage.getItem("auth_token");
        if (!token) {
            console.warn("No auth token found, cannot ensure connection");
            return;
        }

        if (
            !this.echo ||
            this.echo.connector.pusher.connection.state !== "connected"
        ) {
            this.initializeEcho();
        }
    }
}

export default new SocketService();
